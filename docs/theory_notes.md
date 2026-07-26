# Queueing Theory Notes

## M/M/1 Queue

An M/M/1 queue models a system with:

- Random, independent job arrivals
- Exponentially distributed service times
- One server
- First-come, first-served processing
- Unlimited waiting space

Let:

- λ = average arrival rate
- μ = average service rate
- ρ = server utilization

The system is stable only when:

**λ < μ**

If jobs arrive as quickly as or faster than the server can process them, the expected queue will continue growing.

## Performance Metrics

### Utilization

ρ = λ / μ

### Average number of jobs in the system

L = λ / (μ − λ)

### Average number of jobs waiting in the queue

Lq = λ² / [μ(μ − λ)]

### Average total time in the system

W = 1 / (μ − λ)

### Average waiting time before service

Wq = λ / [μ(μ − λ)]

## Example

For an arrival rate of 30 jobs per hour and a service rate of 60 jobs per hour:

- Utilization: 50%
- Average number in the queue: 0.5 jobs
- Average number in the system: 1 job
- Average waiting time: 1 minute
- Average total time in the system: 2 minutes

This example was verified using the `mm1_metrics` function in
`src/queueing_metrics.py`.