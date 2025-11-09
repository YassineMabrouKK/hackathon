# Project Name: InjuryAlert ⚽🩺

**Real-time football player monitoring and AI-based injury prediction.**

---

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Setup & Installation](#setup--installation)
6. [Usage](#usage)
7. [Data Flow](#data-flow)
8. [Model Integration](#model-integration)
9. [Contributing](#contributing)
10. [License](#license)

---

## Overview
This project monitors football players in real-time using ESP32 sensors (heart rate, SpO2, steps).  
The data is sent to a Node.js backend, stored in MongoDB, displayed on a React frontend, and fed to an ONNX AI model to predict potential injuries.

---

## Features
- Real-time data acquisition from ESP32 sensors.  
- MongoDB backend for storing player data.  
- React frontend to display dashboards and charts.  
- Player data form for manual updates.  
- AI-based injury prediction using ONNX model.  
- Organized development workflow using GitHub and Jira.

---

## Architecture
```text
ESP32 Sensors → Node.js Backend → MongoDB → React Frontend
                                 ↓
                              ONNX Model
                                 ↓
                           Injury Prediction
