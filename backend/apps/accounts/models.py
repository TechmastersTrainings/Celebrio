import uuid
import secrets
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone

class UserRole(models.TextChoices):
    ANON_GUEST = 'ANON_GUEST', 'Anonymous Guest'
    AUTH_CUSTOMER = 'AUTH_CUSTOMER', 'Verified Customer'
    DEV_PENDING = 'DEV_PENDING', 'Pending Developer'
    DEV_ACTIVE = 'DEV_ACTIVE', 'Approved Creative Developer'
    DEV_VIDEO = 'DEV_VIDEO', 'Video Production Specialist'
    OPS_ADMIN = 'OPS_ADMIN', 'Operations Administrator'
    SUPER_ADMIN = 'SUPER_ADMIN', 'System Super Administrator'

class ApprovalStatus(models.TextChoices):
    PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Approval'
    APPROVED_ACTIVE = 'APPROVED_ACTIVE', 'Approved Active'
    REJECTED = 'REJECTED', 'Rejected'
    SUSPENDED = 'SUSPENDED', 'Suspended'

class UserManager(BaseUserManager):
    def create_user(self, email=None, phone_number=None, password=None, **extra_fields):
        if not email and not phone_number:
            raise ValueError('Either an email or phone number must be provided.')
        
        if email:
            email = self.normalize_email(email)
        
        user = self.model(email=email, phone_number=phone_number, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', UserRole.SUPER_ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email=email, password=password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, null=True, blank=True, max_length=255)
    phone_number = models.CharField(max_length=20, unique=True, null=True, blank=True, db_index=True)
    full_name = models.CharField(max_length=150)
    role = models.CharField(
        max_length=30,
        choices=UserRole.choices,
        default=UserRole.ANON_GUEST,
        db_index=True
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.full_name} ({self.email or self.phone_number}) [{self.role}]"

    @property
    def is_admin_role(self):
        return self.role in [UserRole.OPS_ADMIN, UserRole.SUPER_ADMIN] or self.is_superuser

    @property
    def is_approved_developer(self):
        if self.role in [UserRole.DEV_ACTIVE, UserRole.DEV_VIDEO]:
            if hasattr(self, 'developer_profile'):
                return self.developer_profile.approval_status == ApprovalStatus.APPROVED_ACTIVE
            return True
        return False

    @property
    def can_produce_video(self):
        if self.is_admin_role:
            return True
        if hasattr(self, 'developer_profile'):
            return self.developer_profile.can_produce_video and self.is_approved_developer
        return False

class DeveloperProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='developer_profile')
    approval_status = models.CharField(
        max_length=30,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING_APPROVAL,
        db_index=True
    )
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_developers'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    can_produce_video = models.BooleanField(default=False)
    max_active_tickets = models.PositiveIntegerField(default=3)
    portfolio_url = models.URLField(max_length=500, null=True, blank=True)
    skills = models.JSONField(default=list, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)
    suspension_reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'developer_profiles'

    def __str__(self):
        return f"Profile for {self.user.full_name} ({self.approval_status})"

class OTPChallenge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=20, db_index=True)
    otp_hash = models.CharField(max_length=255)
    order_reference = models.CharField(max_length=30, null=True, blank=True, db_index=True)
    attempts_count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField()
    is_consumed = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'otp_challenges'

    def is_valid(self):
        return (not self.is_consumed) and (timezone.now() < self.expires_at) and (self.attempts_count < 3)

class CustomerSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_token = models.CharField(max_length=64, unique=True, db_index=True)
    phone_number = models.CharField(max_length=20, db_index=True)
    customer_name = models.CharField(max_length=150, null=True, blank=True)
    order_reference = models.CharField(max_length=30, null=True, blank=True, db_index=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'customer_sessions'

    def is_valid(self):
        return self.is_active and (timezone.now() < self.expires_at)

    @classmethod
    def create_session(cls, phone_number, customer_name=None, order_reference=None, ttl_hours=24):
        token = secrets.token_hex(32)
        expires = timezone.now() + timezone.timedelta(hours=ttl_hours)
        return cls.objects.create(
            session_token=token,
            phone_number=phone_number,
            customer_name=customer_name,
            order_reference=order_reference,
            expires_at=expires
        )

