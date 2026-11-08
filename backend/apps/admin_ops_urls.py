from django.urls import path
from .admin_ops_views import (
    AdminDashboardMetricsView,
    AdminTicketListView,
    AdminTicketReassignView,
    AdminTicketReleaseView,
    AdminAuditLogsListView
)

urlpatterns = [
    path('metrics/', AdminDashboardMetricsView.as_view(), name='admin_metrics'),
    path('tickets/', AdminTicketListView.as_view(), name='admin_tickets'),
    path('tickets/<uuid:ticket_id>/reassign/', AdminTicketReassignView.as_view(), name='admin_ticket_reassign'),
    path('tickets/<uuid:ticket_id>/release/', AdminTicketReleaseView.as_view(), name='admin_ticket_release'),
    path('audit-logs/', AdminAuditLogsListView.as_view(), name='admin_audit_logs'),
]

