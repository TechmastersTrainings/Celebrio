from django.urls import path
from .admin_ops_views import (
    AdminDashboardMetricsView,
    AdminUsersListView,
    AdminUserActionView,
    AdminTicketListView,
    AdminTicketStatusUpdateView,
    AdminTicketReassignView,
    AdminTicketReleaseView,
    AdminPaymentsListView,
    AdminPaymentMarkPaidView,
    AdminFinancialAnalyticsView,
    AdminAuditLogsListView
)

urlpatterns = [
    path('metrics/', AdminDashboardMetricsView.as_view(), name='admin_metrics'),
    path('users/', AdminUsersListView.as_view(), name='admin_users_list'),
    path('users/<uuid:user_id>/update/', AdminUserActionView.as_view(), name='admin_user_update'),
    path('users/<uuid:user_id>/delete/', AdminUserActionView.as_view(), name='admin_user_delete'),
    path('tickets/', AdminTicketListView.as_view(), name='admin_tickets'),
    path('tickets/<uuid:ticket_id>/status/', AdminTicketStatusUpdateView.as_view(), name='admin_ticket_status_update'),
    path('tickets/<uuid:ticket_id>/delete/', AdminTicketStatusUpdateView.as_view(), name='admin_ticket_delete'),
    path('tickets/<uuid:ticket_id>/reassign/', AdminTicketReassignView.as_view(), name='admin_ticket_reassign'),
    path('tickets/<uuid:ticket_id>/release/', AdminTicketReleaseView.as_view(), name='admin_ticket_release'),
    path('payments/', AdminPaymentsListView.as_view(), name='admin_payments_list'),
    path('payments/mark-paid/', AdminPaymentMarkPaidView.as_view(), name='admin_payment_mark_paid'),
    path('financials/', AdminFinancialAnalyticsView.as_view(), name='admin_financials'),
    path('audit-logs/', AdminAuditLogsListView.as_view(), name='admin_audit_logs'),
]
