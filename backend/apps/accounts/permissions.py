from rest_framework.permissions import BasePermission
from .models import UserRole, ApprovalStatus

class IsAdminUserRole(BasePermission):
    """
    Allows access only to TechMasters Operations Administrators and Super Admins.
    """
    message = "Administrator access required."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_admin_role
        )

class IsApprovedDeveloper(BasePermission):
    """
    Allows access only to internal TechMasters developers who have been
    explicitly reviewed and approved by an Administrator.
    """
    message = "Approved active developer status required. Your account may be pending approval or suspended."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_approved_developer
        )

class CanProduceVideoPermission(BasePermission):
    """
    Allows access only to developers with explicit video production permissions.
    """
    message = "Video production specialist permission required."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.can_produce_video
        )

class IsAssignedDeveloperOrAdmin(BasePermission):
    """
    Object-level permission: allows developers to access only tickets/tasks assigned to them,
    while administrators retain full access.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin_role:
            return True
        
        # Check if ticket has assigned_developer
        assigned_dev = getattr(obj, 'assigned_developer', None)
        if assigned_dev and assigned_dev == request.user:
            return True
            
        # Check for video task specialist
        assigned_specialist = getattr(obj, 'assigned_specialist', None)
        if assigned_specialist and assigned_specialist == request.user:
            return True

        return False

class IsVerifiedCustomerOwnerOrStaff(BasePermission):
    """
    Allows verified customer access to their own order records, or staff access.
    """
    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_admin_role):
            return True

        customer_session = getattr(request, 'customer_session', None)
        if not customer_session or not customer_session.is_valid():
            return False

        customer_mobile = getattr(obj, 'customer_mobile', None)
        if customer_mobile and customer_mobile == customer_session.phone_number:
            return True

        order_ref = getattr(obj, 'order_reference', None)
        if order_ref and customer_session.order_reference == order_ref:
            return True

        return False

