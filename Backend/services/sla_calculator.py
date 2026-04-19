from datetime import datetime

def calculate_sla_score(created_at, deadline, priority):
    """
    Calculates the SLA score for a given complaint based on remaining time and priority weights.
    
    Args:
        created_at (datetime): The time the complaint was created.
        deadline (datetime): The target deadline for resolution.
        priority (str): The priority level ('High', 'Medium', 'Low').
        
    Returns:
        dict: A dictionary containing base_score, final_score, and status.
    """
    # Use timezone-aware 'now' if the inputs are timezone-aware
    if created_at.tzinfo:
        current_time = datetime.now(created_at.tzinfo)
    else:
        current_time = datetime.now()
        
    # Edge case: deadline has already passed
    if current_time >= deadline:
        return {
            "base_score": 0.0,
            "final_score": 0.0,
            "status": "Breached"
        }
        
    total_time_seconds = (deadline - created_at).total_seconds()
    remaining_time_seconds = (deadline - current_time).total_seconds()
    
    # Edge case: Division by zero or negative total time
    if total_time_seconds <= 0:
        return {
            "base_score": 0.0,
            "final_score": 0.0,
            "status": "Breached"
        }
        
    base_score = (remaining_time_seconds / total_time_seconds) * 100.0
    base_score = min(100.0, max(0.0, base_score)) # Ensure between 0 and 100
    
    # Priority weighting
    weight = 1.0
    if priority and isinstance(priority, str):
        priority_lower = priority.lower()
        if priority_lower == "high":
            weight = 1.5
        elif priority_lower == "medium":
            weight = 1.2
            
    final_score = base_score * weight
    final_score = min(100.0, final_score)
    
    # Determine Status
    if final_score > 70:
        status = "On Track"
    elif final_score > 30:
        status = "At Risk"
    else:
        status = "Breached"
        
    return {
        "base_score": round(base_score, 2),
        "final_score": round(final_score, 2),
        "status": status
    }
