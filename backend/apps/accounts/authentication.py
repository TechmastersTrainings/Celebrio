from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from .models import CustomerSession

class CustomerSessionAuthentication(BaseAuthentication):
    """
    Authenticates customer sessions using the custom `X-Customer-Token` header.
    Attaches `request.customer_session` for fine-grained customer query scoping.
    """
    def authenticate(self, request):
        token = request.headers.get('X-Customer-Token')
        if not token:
            return None

        try:
            session = CustomerSession.objects.get(session_token=token, is_active=True)
        except CustomerSession.DoesNotExist:
            raise exceptions.AuthenticationFailed('Invalid customer session token.')

        if not session.is_valid():
            raise exceptions.AuthenticationFailed('Customer session token has expired.')

        # Attach customer_session to request for downstream views/permissions
        request.customer_session = session

        # Return (None, auth_data) because customer is session-authenticated rather than a User model instance
        return (None, session)

