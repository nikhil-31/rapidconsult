def get_permissions_for_role(role_name):
    # Example static mapping. You could fetch this from DB or Role model instead.
    role_permissions = {
        "admin": ["create_user", "delete_user", "assign_shifts", "view_all_data"],
        "doctor": ["view_schedule", "mark_availability"],
        "nurse": ["view_schedule"],
        "manager": ["assign_shifts", "view_schedule"]
    }
    return role_permissions.get(role_name.lower(), [])
