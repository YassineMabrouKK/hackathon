from ultralytics import YOLO
import numpy as np
import cv2
from collections import deque

# Models
pose_model = YOLO("yolov8n-pose.pt")
det_model = YOLO("yolov8n.pt")

# Ball class ID
BALL_CLASS_ID = None
for k, v in det_model.names.items():
    if v.lower() == "sports ball":
        BALL_CLASS_ID = int(k)
        break
if BALL_CLASS_ID is None:
    raise ValueError("'sports ball' not found in model class names.")

video_path = r"C:\Users\adam1\Downloads\d13.mp4"  # Put your actual path here!
cap = cv2.VideoCapture(video_path)
cv2.namedWindow('Video', cv2.WINDOW_NORMAL)
scale = 2.0

SKELETON_CONNECTIONS = [
    (5, 7), (7, 9), (6, 8), (8, 10),
    (11, 13), (13, 15), (12, 14), (14, 16),
    (5, 6), (11, 12), (5, 11), (6, 12)
]

NUM_FRAMES_BUFFER = 8
action_buffers = {}        # pid -> deque of keypoints
ground_ankle_heights = {}
shot_counters = {}         # pid -> how long to show shot label
run_counters = {}          # pid -> how long to show running label
jump_counters = {}         # pid -> how long to show jump label

ball_history = deque(maxlen=5)
ball_speed_prev = 0.0

# Tuning parameters
CONTACT_DIST_PX = 60.0
SPEED_SPIKE_PX = 10.0
SPEED_BEFORE_MAX = 5.0
SHOT_LABEL_FRAMES = 12
RUN_LABEL_FRAMES = 12
JUMP_LABEL_FRAMES = 12

def ankle_ground_height(buffer):
    if len(buffer) < 3:
        return None, None
    right_ys = [pose[16][1] for pose in buffer]
    left_ys  = [pose[15][1] for pose in buffer]
    return float(np.median(right_ys)), float(np.median(left_ys))

def get_ball_center(det_res, ball_cls_id):
    if det_res.boxes is None or det_res.boxes.xyxy is None:
        return None
    boxes = det_res.boxes.xyxy.cpu().numpy()
    clses = det_res.boxes.cls.cpu().numpy().astype(int)
    confs = det_res.boxes.conf.cpu().numpy()
    idxs = np.where(clses == ball_cls_id)[0]
    if len(idxs) == 0:
        return None
    best = idxs[np.argmax(confs[idxs])]
    x1, y1, x2, y2 = boxes[best]
    cx = (x1 + x2) / 2.0
    cy = (y1 + y2) / 2.0
    return np.array([cx, cy], dtype=np.float32)

def ball_speed():
    if len(ball_history) < 2:
        return 0.0, None
    p0, p1 = ball_history[-2], ball_history[-1]
    v = p1 - p0
    return float(np.linalg.norm(v)), v

def is_running(person_pair):
    if len(person_pair) < 2:
        return False
    prev_kp, curr_kp = person_pair
    rh, rk, ra = curr_kp[12], curr_kp[14], curr_kp[16]
    lh, lk, la = curr_kp[11], curr_kp[13], curr_kp[15]
    right_foot_speed = np.linalg.norm(ra - prev_kp[16])
    left_foot_speed = np.linalg.norm(la - prev_kp[15])
    right_leg_straight = np.linalg.norm(rh-ra) > 60 and np.linalg.norm(rh-rk) > 35
    left_leg_straight = np.linalg.norm(lh-la) > 60 and np.linalg.norm(lh-lk) > 35
 
    return right_foot_speed > 18 and left_foot_speed > 18 and (right_leg_straight or left_leg_straight)

def is_jumping(person_pair, ground_right, ground_left):
    if len(person_pair) < 2 or ground_right is None or ground_left is None:
        return False
    prev_kp, curr_kp = person_pair
    ra_prev, la_prev = prev_kp[16], prev_kp[15]
    ra_curr, la_curr = curr_kp[16], curr_kp[15]
    right_v = ra_prev[1] - ra_curr[1]
    left_v = la_prev[1] - la_curr[1]
    feet_upward = right_v > 5 and left_v > 5
    ground_margin = 6
    feet_off_ground = (ground_right - ra_curr[1] > ground_margin) and (ground_left - la_curr[1] > ground_margin)
    rh_prev, lh_prev = prev_kp[12], prev_kp[11]
    rh_curr, lh_curr = curr_kp[12], curr_kp[11]
    hips_v = (rh_prev[1] + lh_prev[1])/2 - (rh_curr[1] + lh_curr[1])/2
    hips_upward = hips_v > 4
    rh, ra = curr_kp[12], curr_kp[16]
    lh, la = curr_kp[11], curr_kp[15]
    right_leg_straight = np.linalg.norm(rh - ra) > 40
    left_leg_straight = np.linalg.norm(lh - la) > 40
    return feet_upward and feet_off_ground and hips_upward and (right_leg_straight or left_leg_straight)

while True:
    ok, frame = cap.read()
    if not ok: break

   
    det_out = det_model.predict(source=frame, imgsz=640, conf=0.25, verbose=False)[0]
    bcenter = get_ball_center(det_out, BALL_CLASS_ID)
    if bcenter is not None:
        ball_history.append(bcenter)
    curr_speed, vdir = ball_speed()

    
    pose_out = pose_model.predict(source=frame, stream=False, save=False, verbose=False)[0]
    draw_frame = frame.copy()

    if hasattr(pose_out, 'keypoints') and pose_out.keypoints is not None:
        keypoints_all = pose_out.keypoints.xy.cpu().numpy()
        boxes_all = pose_out.boxes.xyxy.cpu().numpy() if pose_out.boxes is not None else []
        for box_id, (box, person_kp) in enumerate(zip(boxes_all, keypoints_all)):
            pid = box_id
            if pid not in action_buffers:
                action_buffers[pid] = deque(maxlen=NUM_FRAMES_BUFFER)
                ground_ankle_heights[pid] = (None, None)
                shot_counters[pid] = 0
                run_counters[pid] = 0
                jump_counters[pid] = 0
            buffer = action_buffers[pid]
            buffer.append(person_kp)
            # Ground ref for jump
            if len(buffer) == NUM_FRAMES_BUFFER and ground_ankle_heights[pid][0] is None:
                ground_ankle_heights[pid] = ankle_ground_height(buffer)
            ground_right, ground_left = ground_ankle_heights[pid]

            # Running logic
            running_count = 0
            for i in range(len(buffer)-1):
                if is_running([buffer[i], buffer[i+1]]):
                    running_count += 1
            if running_count > int(NUM_FRAMES_BUFFER / 2):
                run_counters[pid] = RUN_LABEL_FRAMES

            # Jumping logic
            jumping_count = 0
            for i in range(len(buffer)-1):
                if is_jumping([buffer[i], buffer[i+1]], ground_right, ground_left):
                    jumping_count += 1
            if jumping_count > int(NUM_FRAMES_BUFFER / 3):
                jump_counters[pid] = JUMP_LABEL_FRAMES

            # Shooting logic
            if bcenter is not None and vdir is not None:
                try:
                    ankle_l = person_kp[15]
                    ankle_r = person_kp[16]
                    d_l = np.linalg.norm(ankle_l - bcenter)
                    d_r = np.linalg.norm(ankle_r - bcenter)
                    d_min = min(d_l, d_r)
                    closest_ankle = ankle_r if d_r < d_l else ankle_l
                    contact = d_min < CONTACT_DIST_PX
                    was_stationary = ball_speed_prev < SPEED_BEFORE_MAX
                    speed_increased = curr_speed > SPEED_SPIKE_PX
                    moving_away = np.dot(vdir, (bcenter - closest_ankle)) > 0
                    if contact and was_stationary and speed_increased and moving_away:
                        if shot_counters[pid] == 0:
                            shot_counters[pid] = SHOT_LABEL_FRAMES
                except Exception as e:
                    print(e)

            # Draw box
            x1, y1, x2, y2 = box
            cv2.rectangle(draw_frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 0, 255), 2)
            for x, y in person_kp:
                cv2.circle(draw_frame, (int(x), int(y)), 4, (0, 255, 0), -1)
            for start, end in SKELETON_CONNECTIONS:
                pt1 = tuple(map(int, person_kp[start]))
                pt2 = tuple(map(int, person_kp[end]))
                cv2.line(draw_frame, pt1, pt2, (255, 0, 0), 2)

            # Labels
            label_y = int(y1) - 10
            if run_counters[pid] > 0:
                cv2.putText(draw_frame, 'RUNNING', (int(x1), label_y),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 3, cv2.LINE_AA)
                run_counters[pid] -= 1
                label_y -= 30
            if jump_counters[pid] > 0:
                cv2.putText(draw_frame, 'JUMPING', (int(x1), label_y),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0,128,255), 3, cv2.LINE_AA)
                jump_counters[pid] -= 1
                label_y -= 30
            if shot_counters[pid] > 0:
                cv2.putText(draw_frame, 'SHOT', (int(x1), label_y),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 165, 255), 3, cv2.LINE_AA)
                shot_counters[pid] -= 1
                label_y -= 30
            # Debug Y
            cv2.putText(draw_frame,
                        f"RAnkY:{int(person_kp[16][1])} LAnkY:{int(person_kp[15][1])}",
                        (int(x1), int(y2) + 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    # Ball center + speed
    if bcenter is not None:
        cv2.circle(draw_frame, (int(bcenter[0]), int(bcenter[1])), 7, (0, 255, 255), -1)
    cv2.putText(draw_frame, f"BallSpeed:{curr_speed:.1f}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

    frame_large = cv2.resize(draw_frame, (0, 0), fx=scale, fy=scale)
    cv2.imshow('Video', frame_large)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
    ball_speed_prev = curr_speed

cap.release()
cv2.destroyAllWindows()
