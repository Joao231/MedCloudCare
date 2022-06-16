
from pathlib import Path
import os
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'cyv2)*7r6@$r%ip9$q#cz=3xo0tgh$p#z07$0xwb$24!0ns%l#'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ["*"]   #important

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'container_api.apps.ApiConfig',
    'rest_framework',
    'rest_framework.authtoken',
    'django.contrib.sites',
    'djoser',
    'social_django',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'rest_social_auth',
    'corsheaders',
    'guardian',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
]


SITE_ID = 1

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'social_django.middleware.SocialAuthExceptionMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ORIGIN_ALLOW_ALL = True

CORS_ALLOW_CREDENTIALS = True


ROOT_URLCONF = 'medical_app.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'social_django.context_processors.backends',
                'social_django.context_processors.login_redirect',
                'django.template.context_processors.media',
            ],
        },
    },
]

WSGI_APPLICATION = 'medical_app.wsgi.application'


# Database
# https://docs.djangoproject.com/en/3.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',

        'NAME': 'postgres',

        'USER': os.getenv('POSTGRES_USER'),

        'PASSWORD': os.getenv('POSTGRES_PASSWORD'),

        'HOST': os.getenv('POSTGRES_HOST'),

        'PORT': os.getenv('POSTGRES_PORT'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/3.1/ref/settings/#auth-password-validators

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
#EMAIL_HOST_USER = 
#EMAIL_HOST_PASSWORD = 
EMAIL_USE_TLS = True

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/3.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = False #important


MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')



# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.1/howto/static-files/

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'build/static')
]
STATIC_ROOT = os.path.join(BASE_DIR, 'static')

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated'
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
} 


AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
    'guardian.backends.ObjectPermissionBackend',
    'social_core.backends.google.GoogleOAuth2',
    'social_core.backends.facebook.FacebookOAuth2',
    'social_core.backends.twitter.TwitterOAuth',
    'social_core.backends.github.GithubOAuth2',
    'social_core.backends.linkedin.LinkedinOAuth2',
    'social_core.backends.spotify.SpotifyOAuth2',
    'social_core.backends.slack.SlackOAuth2',
)


SIMPLE_JWT = {
    'AUTH_HEADER_TYPES': ('JWT',),
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=180),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=90),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_TOKEN_CLASSES': (
        'rest_framework_simplejwt.tokens.AccessToken',
    ),
}

'''add these
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': False,'''


DJOSER = {
    'LOGIN_FIELD': 'email',
    'PASSWORD_RESET_CONFIRM_RETYPE': True,
    'USER_CREATE_PASSWORD_RETYPE': True,
    'USERNAME_CHANGED_EMAIL_CONFIRMATION': True,
    'PASSWORD_CHANGED_EMAIL_CONFIRMATION': True,
    'SEND_CONFIRMATION_EMAIL': True,
    'SET_USERNAME_RETYPE': True,
    'SET_PASSWORD_RETYPE': True,
    'PASSWORD_RESET_CONFIRM_URL': 'password/reset/confirm/{uid}/{token}',
    'USERNAME_RESET_CONFIRM_URL': 'email/reset/confirm/{uid}/{token}',
    'ACTIVATION_URL': 'activate/{uid}/{token}',
    'SEND_ACTIVATION_EMAIL': True,
    'SOCIAL_AUTH_TOKEN_STRATEGY': 'djoser.social.token.jwt.TokenStrategy',
    'SOCIAL_AUTH_ALLOWED_REDIRECT_URIS': ['http://localhost/google', 'http://localhost/facebook', 'http://localhost/complete/github/', 'http://localhost/complete/linkedin/', 'http://localhost/callback/spotify/'],
    'SERIALIZERS': {
        'user_create': 'container_api.serializers.UserCreateSerializer',
        'user': 'container_api.serializers.UserCreateSerializer',
        'current_user': 'container_api.serializers.UserCreateSerializer',
        'user_delete': 'djoser.serializers.UserDeleteSerializer',
    }
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
ACCOUNT_DEFAULT_HTTP_PROTOCOL = 'https'



#SOCIAL_AUTH_GOOGLE_OAUTH2_KEY =
#SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET =
SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile', 'openid']
SOCIAL_AUTH_GOOGLE_OAUTH2_EXTRA_DATA = ['first_name', 'last_name']



#SOCIAL_AUTH_FACEBOOK_KEY =
#SOCIAL_AUTH_FACEBOOK_SECRET =
SOCIAL_AUTH_FACEBOOK_SCOPE = ['email']
SOCIAL_AUTH_FACEBOOK_PROFILE_EXTRA_PARAMS = {
    'fields': 'email, first_name, last_name'
}



#SOCIAL_AUTH_GITHUB_KEY =
#SOCIAL_AUTH_GITHUB_SECRET =
SOCIAL_AUTH_GITHUB_SCOPE = ['user:email']



#SOCIAL_AUTH_SPOTIFY_KEY = 
#SOCIAL_AUTH_SPOTIFY_SECRET = 
SOCIAL_AUTH_SPOTIFY_SCOPE = ['user-read-email']



#SOCIAL_AUTH_LINKEDIN_OAUTH2_KEY = 
#SOCIAL_AUTH_LINKEDIN_OAUTH2_SECRET =
# Add email to requested authorizations.
SOCIAL_AUTH_LINKEDIN_OAUTH2_SCOPE = ['r_liteprofile', 'r_emailaddress']
# Add the fields so they will be requested from linkedin.
SOCIAL_AUTH_LINKEDIN_OAUTH2_FIELD_SELECTORS = ['emailAddress']
# Arrange to add the fields to UserSocialAuth.extra_data
SOCIAL_AUTH_LINKEDIN_OAUTH2_EXTRA_DATA = [('id', 'id'),
                                          ('firstName', 'first_name'),
                                          ('lastName', 'last_name'),
                                          ('emailAddress', 'email_address')]


DOMAIN=('localhost')
SITE_NAME=('Viewer')

AUTH_USER_MODEL = 'container_api.UserAccount'

CORS_WHITE_LIST = ["http://localhost:3000", "http://127.0.0.1:3000", "http://Backend", "http://backend"]

DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880
