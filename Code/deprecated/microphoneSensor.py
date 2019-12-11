#! /usr/bin/python

import RPi.GPIO as GPIO
import time

PIN=36
GPIO.setmode(GPIO.BOARD)
GPIO.setup(PIN,GPIO.IN)

def callback(PIN):
    if GPIO.input(PIN):
        print(str(time.time())+" 1")
    #else:
    #    print("0")

GPIO.add_event_detect(PIN, GPIO.RISING, bouncetime=300)#detects if PIN high or low

GPIO.add_event_callback(PIN, callback)

while True:
    time.sleep(0.2)
