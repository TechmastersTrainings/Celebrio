from django.urls import path
from .workspace_views import (
    WorkspaceAvailableTicketsView,
    WorkspaceClaimFIFOTicketView,
    WorkspaceAssignedTicketsView,
    WorkspaceUploadDesignView,
    WorkspaceVideoTasksView,
    WorkspaceClaimVideoTaskView,
)

urlpatterns = [
    path('tickets/available/', WorkspaceAvailableTicketsView.as_view(), name='workspace_available_tickets'),
    path('tickets/claim-fifo/', WorkspaceClaimFIFOTicketView.as_view(), name='workspace_claim_fifo'),
    path('tickets/assigned/', WorkspaceAssignedTicketsView.as_view(), name='workspace_assigned_tickets'),
    path('tickets/<uuid:ticket_id>/designs/', WorkspaceUploadDesignView.as_view(), name='workspace_upload_design'),
    path('video-tasks/', WorkspaceVideoTasksView.as_view(), name='workspace_video_tasks'),
    path('video-tasks/<uuid:task_id>/claim/', WorkspaceClaimVideoTaskView.as_view(), name='workspace_claim_video_task'),
]

