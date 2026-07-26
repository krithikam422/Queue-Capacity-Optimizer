"""Analytical queueing models used by QueuePilot."""


def mm1_metrics(arrival_rate: float, service_rate: float) -> dict[str, float]:
    """
    Calculate performance metrics for an M/M/1 queue.

    Parameters
    ----------
    arrival_rate:
        Average number of jobs arriving per hour.
    service_rate:
        Average number of jobs one server can process per hour.

    Returns
    -------
    dict
        Utilization, queue lengths, and waiting-time metrics.
    """
    if arrival_rate <= 0:
        raise ValueError("Arrival rate must be greater than zero.")

    if service_rate <= 0:
        raise ValueError("Service rate must be greater than zero.")

    if arrival_rate >= service_rate:
        raise ValueError(
            "The queue is unstable because the arrival rate must be "
            "lower than the service rate."
        )

    utilization = arrival_rate / service_rate

    avg_number_in_system = arrival_rate / (service_rate - arrival_rate)

    avg_number_in_queue = (
        arrival_rate**2
        / (service_rate * (service_rate - arrival_rate))
    )

    avg_time_in_system_hours = 1 / (service_rate - arrival_rate)

    avg_wait_in_queue_hours = (
        arrival_rate
        / (service_rate * (service_rate - arrival_rate))
    )

    return {
        "utilization": utilization,
        "avg_number_in_system": avg_number_in_system,
        "avg_number_in_queue": avg_number_in_queue,
        "avg_time_in_system_minutes": avg_time_in_system_hours * 60,
        "avg_wait_in_queue_minutes": avg_wait_in_queue_hours * 60,
    }