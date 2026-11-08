import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.orders.models import Order

class TicketStatus(models.TextChoices):
    NEW_OPEN = 'NEW_OPEN', 'New / Open'
    ASSIGNED = 'ASSIGNED', 'Assigned'
    WORK_IN_PROGRESS = 'WORK_IN_PROGRESS', 'Work in Progress'
    INTERNAL_REVIEW = 'INTERNAL_REVIEW', 'Internal Review'
    AWAITING_CUSTOMER_RESPONSE = 'AWAITING_CUSTOMER_RESPONSE', 'Awaiting Customer Response'
    AWAITING_PAYMENT = 'AWAITING_PAYMENT', 'Awaiting Payment'
    PAYMENT_DONE = 'PAYMENT_DONE', 'Payment Done'
    CLOSED = 'CLOSED', 'Closed'
    ON_HOLD = 'ON_HOLD', 'On Hold'
    CANCELLED = 'CANCELLED', 'Cancelled'
    REOPENED = 'REOPENED', 'Reopened'

class TicketPriority(models.TextChoices):
    LOW = 'LOW', 'Low'
    NORMAL = 'NORMAL', 'Normal'
    HIGH = 'HIGH', 'High'
    URGENT = 'URGENT', 'Urgent'

CUSTOMER_STATUS_MAP = {
    TicketStatus.NEW_OPEN: 'Order Received',
    TicketStatus.ASSIGNED: 'Design Team Assigned',
    TicketStatus.WORK_IN_PROGRESS: 'Designing Your Invitation',
    TicketStatus.INTERNAL_REVIEW: 'Quality Check in Progress',
    TicketStatus.AWAITING_CUSTOMER_RESPONSE: 'Preview Ready for Review',
    TicketStatus.AWAITING_PAYMENT: 'Design Approved — Awaiting Payment',
    TicketStatus.PAYMENT_DONE: 'Payment Received — Finalizing Publishing',
    TicketStatus.CLOSED: 'Celebration Live & Delivered',
    TicketStatus.ON_HOLD: 'Clarification Required',
    TicketStatus.CANCELLED: 'Order Cancelled',
    TicketStatus.REOPENED: 'Post-Delivery Update in Progress',
}

CUSTOMER_EXPLANATION_MAP = {
    TicketStatus.NEW_OPEN: 'Your celebration requirements have been received and logged. Our creative team will pick this up shortly.',
    TicketStatus.ASSIGNED: 'A dedicated TechMasters designer has been assigned to your celebration.',
    TicketStatus.WORK_IN_PROGRESS: 'Our creative team is crafting your personalized digital invitation and cards.',
    TicketStatus.INTERNAL_REVIEW: 'Our senior creative director is reviewing your invitation drafts to ensure perfection.',
    TicketStatus.AWAITING_CUSTOMER_RESPONSE: 'Your personalized preview is ready! Please review and approve or suggest changes.',
    TicketStatus.AWAITING_PAYMENT: 'You have approved the design. Please complete payment to unlock your public link and HD files.',
    TicketStatus.PAYMENT_DONE: 'Payment confirmed. Our team is generating your high-res cards, QR code, and public link.',
    TicketStatus.CLOSED: 'Your digital celebration is live! Access your public invitation link, QR code, and final files below.',
    TicketStatus.ON_HOLD: 'We need a quick detail to proceed with your invitation. Please check the notes or contact support.',
    TicketStatus.CANCELLED: 'This order has been cancelled. Please contact support if you need assistance.',
    TicketStatus.REOPENED: 'An update to your celebration is currently being processed by our creative team.',
}

class Ticket(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=30, unique=True, db_index=True)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='ticket')
    status = models.CharField(
        max_length=35,
        choices=TicketStatus.choices,
        default=TicketStatus.NEW_OPEN,
        db_index=True
    )
    priority = models.CharField(
        max_length=20,
        choices=TicketPriority.choices,
        default=TicketPriority.NORMAL
    )
    assigned_developer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
        db_index=True
    )
    eligible_at = models.DateTimeField(default=timezone.now, db_index=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    wip_started_at = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    is_on_hold = models.BooleanField(default=False)
    hold_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tickets'
        ordering = ['eligible_at']

    def __str__(self):
        return f"{self.ticket_number} [{self.status}] - Assigned: {self.assigned_developer or 'UNASSIGNED'}"

    @property
    def customer_facing_status(self):
        return CUSTOMER_STATUS_MAP.get(self.status, self.status)

    @property
    def customer_facing_explanation(self):
        return CUSTOMER_EXPLANATION_MAP.get(self.status, '')

class TicketStatusHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='status_history')
    previous_status = models.CharField(max_length=35)
    new_status = models.CharField(max_length=35)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    transition_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'ticket_status_history'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.ticket.ticket_number}: {self.previous_status} -> {self.new_status}"

class TicketAssignmentHistory(models.Model):
    ASSIGNMENT_TYPES = [
        ('FIFO_SELF_CLAIM', 'FIFO Self-Claim'),
        ('ADMIN_MANUAL_ASSIGN', 'Admin Manual Assignment'),
        ('ADMIN_REASSIGN', 'Admin Reassignment'),
        ('RELEASED_TO_QUEUE', 'Released Back to Queue'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='assignment_history')
    developer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='developer_assignment_history'
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_assignment_history'
    )
    assignment_type = models.CharField(max_length=30, choices=ASSIGNMENT_TYPES, default='FIFO_SELF_CLAIM')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'ticket_assignment_history'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.ticket.ticket_number} -> {self.developer.full_name} ({self.assignment_type})"

class TicketInternalNote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='internal_notes')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    note_text = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'ticket_internal_notes'
        ordering = ['-created_at']

    def __str__(self):
        return f"Note on {self.ticket.ticket_number} by {self.author.full_name}"

