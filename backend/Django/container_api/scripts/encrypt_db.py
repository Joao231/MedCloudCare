import os

from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os
from PIL import Image
import time
import secrets
import pickle
import codecs


def pad(im_bytes):
	#O espaço de texto simples criptografado AES é um múltiplo inteiro de 16, que não pode ser dividido igualmente, por isso precisa 
	#ser preenchido no ascii correspondente ou seja, se nao for multiplo de 16, ele enfia quantos 0 precisar no fim  ate ser
    padder = padding.PKCS7(128).padder()
    padded_pt = padder.update(im_bytes) + padder.finalize()
    return padded_pt

def unpad(im_bytes):
    unpadder = padding.PKCS7(128).unpadder()
    unpadded_pt = unpadder.update(im_bytes) + unpadder.finalize()
    return unpadded_pt


#Mapeia os dados da imagem para RBG (sistema de cores aditivas em que o Vermelho, o Verde e o Azul são combinados de várias formas de modo a reproduzir um largo espectro cromático)
def trans_formato_RGB(data):
    red, green, blue = tuple(map(lambda e: [data[i] for i in range(0, len(data)) if i % 3 == e], [0, 1, 2]))
    pixels = tuple(zip(red, green, blue))
    return pixels



def AES(padded_pt,modo, key, iv): # O AES gera uma string de 128 bits (= 16 bytes = 16 pixéis).
    # Cifra e o modo.
    if modo=='ECB':
        cipher = Cipher(algorithms.AES(key), modes.ECB(), backend=default_backend())
    elif modo=='CBC':
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    else:
        return -1
    encryptor = cipher.encryptor()
    ct = encryptor.update(padded_pt) + encryptor.finalize()
    #decryptor = cipher.decryptor()
    #decryp = decryptor.update(ct) + decryptor.finalize()
    return ct 


def AES_decifra(ct,modo,key,iv):
    if modo=='ECB':
        cipher = Cipher(algorithms.AES(key), modes.ECB(), backend=default_backend())
    elif modo=='CBC':
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    else:
        return -1
    decryptor = cipher.decryptor()
    decryp = decryptor.update(ct) + decryptor.finalize()
    return decryp 


def cifra(filename, modo, key, iv):
    im = Image.open(filename)

    #Abrir a imagem bmp e converte-la em imagem RGB
    im_bytes = im.convert("RGB").tobytes()
    im_tamanho = len(im_bytes) # tamanho
    print(im_tamanho)
    print(im.size)
    resultado = trans_formato_RGB(AES(pad(im_bytes), modo, key, iv)[:im_tamanho]) #Executa o mapeamento de valor de pixel nos dados criptografados
    #resultado = AES(pad(im_bytes),modo)
    #print(type(resultado))
    
    print(len(resultado))
    print(im.mode)
    #Criar uma nova imagem, armazenando o valor correspondente
    im2 = Image.new("RGB", im.size)
    #im2.putdata([tuple(pixel) for pixel in resultado])
    #resultado = resultado.flatten()
    im2.putdata(resultado)

    #Guardar como imagem no formato correspondente
    im2.save(rf"new_image_cifrado{modo}" + ".bmp")


def decifra(filename, modo, key, iv, email):
    print(key)
    print(iv)
    print(filename)
    im = Image.open(filename)
    im_bytes = im.convert("RGB").tobytes()
    im_tamanho = len(im_bytes) # tamanho
    print(im_tamanho)
    print(im.size)
    resultado = trans_formato_RGB(AES_decifra(pad(im_bytes),modo, key, iv)[:im_tamanho])
    
    
    im2 = Image.new("RGB", im.size)
    #im2.putdata([tuple(pixel) for pixel in resultado])
    #resultado = resultado.flatten()
    im2.putdata(resultado)
    im2.save(f"/usr/src/app/media/medical_certificates/user_{email}/new_image_decifrado{modo}" + ".bmp")
    #resultado = AES_decifra(im_bytes,modo, key, iv)[:im_tamanho]
    return resultado
