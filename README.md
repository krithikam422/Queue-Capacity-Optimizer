# QueuePilot

QueuePilot is a queue analytics and capacity-planning project for operational workflows that combine automated processing with human review.

The project models jobs moving through the following system:

**Incoming jobs → AI processing → Human review → Completed jobs**

Its goal is to help operations teams understand queue buildup, identify bottlenecks, compare capacity decisions, and determine whether jobs can be completed within a target time.

## Project Goals

QueuePilot will:

- Calculate utilization, expected queue length, and waiting time
- Identify overloaded stages and operational bottlenecks
- Compare AI-processing and human-review capacity scenarios
- Simulate individual jobs moving through a two-stage workflow
- Estimate the percentage of jobs completed within a 30-minute target
- Present results through an interactive dashboard

## Version 1 Scope

The first version assumes:

- Jobs arrive individually at random
- Jobs are processed first-come, first-served
- The workflow contains one AI-processing stage and one human-review stage
- Arrival and service rates remain constant during each scenario
- AI and human capacity can be configured

Priority queues, abandonment, rework, and staffing shifts are outside the initial scope.

## Current Progress

- [x] Initialize repository and project structure
- [ ] Implement and validate an M/M/1 queueing model
- [ ] Add multiple-server capacity analysis
- [ ] Model the two-stage AI–human workflow
- [ ] Build a discrete-event simulation
- [ ] Compare capacity scenarios
- [ ] Create an interactive dashboard

## Repository Structure

```text
Queue-Capacity-Optimizer/
├── docs/           # Queueing-theory explanations and assumptions
├── notebooks/      # Analyses and worked examples
├── src/            # Reusable Python functions
├── README.md
└── requirements.txt


