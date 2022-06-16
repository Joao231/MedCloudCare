import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medical_app.settings")
django.setup()
from container_api.models import UserAccount
from container_api.scripts.cifra import AES


def hello():

    master_key=b'\x95\x98\xa0:\xaa\xf5\xd2\xad\xaafQ\xcd\xf1\xed\xf5\x19'
    master_iv=b':gWd&@\xcav\x01P\x15>\xa0\x08\x96?'

    key = os.urandom(32)    
    iv = os.urandom(16)

    key_encrypt = AES(master_key, master_iv, key, "CBC")

    key_encrypt_hex = key_encrypt.hex()

    iv_encrypt = AES(master_key, master_iv, iv, "CBC")

    iv_encrypt_hex = iv_encrypt.hex()

    super_user = UserAccount.objects.get(is_superuser=True)

    super_user.key_user = key_encrypt_hex
    super_user.iv_user = iv_encrypt_hex
    super_user.save()

hello()