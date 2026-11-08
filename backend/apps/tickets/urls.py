from django.urls import path
from .views import TicketDetailView, TicketStatusUpdateView, TicketInternalNoteCreateView

urlpatterns = [
    path('<uuid:ticket_id>/', TicketDetailView.as_view(), name='ticket_detail'),
    path('<uuid:ticket_id>/status/', TicketStatusUpdateView.as_view(), name='ticket_status_update'),
    path('<uuid:ticket_id>/notes/', TicketInternalNoteCreateView.as_view(), name='ticket_note_create'),
]

