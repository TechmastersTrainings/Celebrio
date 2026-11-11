from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import UserRole, ApprovalStatus, DeveloperProfile, OTPChallenge, CustomerSession

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['full_name'] = user.full_name
        token['is_approved_developer'] = user.is_approved_developer
        token['can_produce_video'] = user.can_produce_video
        return token

    def validate(self, attrs):
        if 'email' in attrs:
            attrs['email'] = str(attrs['email']).strip().lower()
        data = super().validate(attrs)
        user = self.user
        profile = getattr(user, 'developer_profile', None)
        
        data['user'] = {
            'id': str(user.id),
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role,
            'approval_status': profile.approval_status if profile else 'APPROVED_ACTIVE' if user.is_admin_role else 'N/A',
            'can_produce_video': user.can_produce_video,
            'is_approved_developer': user.is_approved_developer,
            'is_admin': user.is_admin_role,
        }
        return data

class DeveloperProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeveloperProfile
        fields = [
            'id',
            'approval_status',
            'can_produce_video',
            'max_active_tickets',
            'portfolio_url',
            'skills',
            'approved_at',
            'rejection_reason',
            'suspension_reason',
            'created_at',
        ]
        read_only_fields = ['id', 'approval_status', 'approved_at', 'created_at']

class UserSerializer(serializers.ModelSerializer):
    developer_profile = DeveloperProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'phone_number',
            'full_name',
            'role',
            'is_active',
            'developer_profile',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

class DeveloperRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    portfolio_url = serializers.URLField(required=False, allow_blank=True)
    skills = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        full_name = validated_data['full_name']
        phone_number = validated_data.get('phone_number') or None
        portfolio_url = validated_data.get('portfolio_url')
        skills = validated_data.get('skills', [])

        user = User.objects.create_user(
            email=email,
            password=password,
            full_name=full_name,
            phone_number=phone_number,
            role=UserRole.DEV_PENDING,
            is_active=True,
            is_staff=False
        )

        DeveloperProfile.objects.create(
            user=user,
            approval_status=ApprovalStatus.PENDING_APPROVAL,
            portfolio_url=portfolio_url,
            skills=skills,
            max_active_tickets=3
        )

        return user

class DeveloperApprovalSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['APPROVE', 'REJECT', 'SUSPEND', 'REACTIVATE'])
    can_produce_video = serializers.BooleanField(required=False)
    max_active_tickets = serializers.IntegerField(required=False, min_value=1, max_value=20)
    reason = serializers.CharField(required=False, allow_blank=True)

class CustomerSendOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    order_reference = serializers.CharField(max_length=30, required=False, allow_blank=True)

class CustomerVerifyOTPSerializer(serializers.Serializer):
    challenge_id = serializers.UUIDField()
    otp = serializers.CharField(min_length=6, max_length=6)

