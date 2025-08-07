def get_permissions_for_role(role_name):
    role_permissions = {
        "admin": ["create_user", "delete_user", "assign_shifts", "view_all_data"],
        "doctor": ["view_schedule", "mark_availability", "messages", "contacts"],
        "nurse": ["view_schedule", "messages", "contacts"],
        "manager": ["assign_shifts", "view_schedule", "messages", "contacts"],
    }
    return role_permissions.get(role_name.lower(), [])
