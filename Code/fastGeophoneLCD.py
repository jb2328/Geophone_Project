#! /usr/bin/python3

# for dev / debug
DEBUG_LOG = False

print("started importing packages")
import time
import board
import busio

import simplejson as json
import requests

import RPi.GPIO as GPIO

#ADS library
import adafruit_ads1x15.ads1015 as ADS
from adafruit_ads1x15.analog_in import AnalogIn

import sys
from st7735_ijl20.st7735 import ST7735

from PIL  import Image
from PIL import ImageDraw
from PIL import ImageFont
from PIL import ImageColor

print("finished importing packages")

# info sent in json packet to feed handler
SENSOR_ID = 'footstep_detector'
SENSOR_TYPE = 'geophone'
ACP_TOKEN = 'testtoken'

# LCD panel size in pixels (0,0) is top left
DISPLAY_WIDTH = 160                # LCD panel width in pixels
DISPLAY_HEIGHT = 128               # LCD panel height

COLOR_FG = "WHITE"
COLOR_BG = "BLACK"

FONT_BIG = ImageFont.truetype('fonts/truetype/freefont/FreeMonoBold.ttf', 20)
FONT_SMALL = ImageFont.truetype('fonts/truetype/freefont/FreeMonoBold.ttf', 10)


# Declare globals
LCD=None
chan=None

class Sensor(object):
	def __init__(self):
		global LCD
		global chan

		self.SAMPLE_HISTORY_SIZE = 100
		self.sample_history_index = 0
		self.sample_history = [None]*self.SAMPLE_HISTORY_SIZE

		#load config here if have it
		GPIO.cleanup()
		LCD=self.init_lcd()
		chan=self.init_geophone()

	def init_lcd(self):
		LCD=ST7735()
		LCD.begin()
		print("starting LCD")

		image=Image.new("RGB", (DISPLAY_WIDTH, DISPLAY_HEIGHT), "WHITE")
		draw = ImageDraw.Draw(image)

		draw.text((32,22), "Geophone", fill="BLUE", font=FONT_BIG)
		draw.text((45,40), "Sensor", fill="BLUE", font=FONT_BIG)
		draw.text((10,60), "for footstep detection", fill="BLUE", font=FONT_SMALL)

		LCD.display(image)

		time.sleep(1)

		image=Image.new("RGB", (DISPLAY_WIDTH, DISPLAY_HEIGHT), COLOR_FG)
		draw = ImageDraw.Draw(image)

		LCD.display(image)

		return LCD
		
		
	def init_geophone(self):
		global chan
				   
		# Create the I2C bus
		i2c = busio.I2C(board.SCL, board.SDA)
			
		# Create the ADC object using the I2C bus
		ads = ADS.ADS1015(i2c)
			
		# Create differential input between channel 0 and 1
		chan = AnalogIn(ads, ADS.P0, ADS.P1)

		return chan

		
		
	def send_data(self,post_data, token):
		response = requests.post('http://128.232.65.223:80/test/feedmaker/test.feed/general',
					  headers={'X-Auth-Token': token },
					  json=post_data
					  )
		
		print("status code",response.status_code)
	
	def updateScreenNumeric(self,value):
		value= "Geophone value: "+str(value)
		
		image = Image.new("RGB", (160,20), COLOR_BG)
		draw = ImageDraw.Draw(image)
	
		draw.text((0, 0), value, fill = "WHITE", font = FONT_SMALL)
	
		#LCD.LCD_ShowImage(image,0,120,w=160,h=20)
		LCD.display_window(image,
						  0,
						  110,
						  160,
						  18)
	
		#LCD_Config.Driver_Delay_ms(250)
	
	def updateScreenVisual(self,value):
		
		#setup for background
		image = Image.new("RGB", (DISPLAY_WIDTH, 108), COLOR_BG)
		draw = ImageDraw.Draw(image)
	
		#draw dark green
		if(value<=16):
			draw.line([(0,10),(159,10)], fill = (0,100,0),width = 20)
		
		#draw dark green, light green
		if(value>16 and value<=48):
			draw.line([(0,10),(159,10)], fill = (0,100,0),width = 20)
			draw.line([(0,30),(159,30)], fill = (0,200,0),width = 20)
		
		#draw dark green, light green, yellow
		if(value>48 and value<=128):
			draw.line([(0,10),(159,10)], fill = (0,100,0),width = 20)
			draw.line([(0,30),(159,30)], fill = (0,200,0),width = 20)
			draw.line([(0,50),(159,50)], fill = (250,250,0),width = 20)
		
		#draw dark green, light green, yellow, orange
		if(value>128 and value<=512):
			draw.line([(0,10),(159,10)], fill = (0,100,0),width = 20)
			draw.line([(0,30),(159,30)], fill = (0,200,0),width = 20)
			draw.line([(0,50),(159,50)], fill = (250,250,0),width = 20)
			draw.line([(0,70),(159,70)], fill = (255,100,0),width = 20)
		
		#draw dark green, light green, yellow, orange, red
		if(value>512 and value<=1024):
			draw.line([(0,10),(159,10)], fill = (0,100,0),width = 20)
			draw.line([(0,30),(159,30)], fill = (0,200,0),width = 20)
			draw.line([(0,50),(159,50)], fill = (250,250,0),width = 20)
			draw.line([(0,70),(159,70)], fill = (255,100,0),width = 20)
			draw.line([(0,90),(159,90)], fill = (255,0,0),width = 20)
			
		#draw dark green, light green, yellow, orange, red, dark red
		if(value>1024):
			draw.line([(0,10),(159,10)], fill = (0,100,0),width = 20)
			draw.line([(0,30),(159,30)], fill = (0,200,0),width = 20)
			draw.line([(0,50),(159,50)], fill = (250,250,0),width = 20)
			draw.line([(0,70),(159,70)], fill = (255,100,0),width = 20)
			draw.line([(0,90),(159,90)], fill = (255,0,0),width = 20)
			draw.line([(0,110),(159,110)], fill = (100,0,0),width = 20)
				
		#LCD.LCD_ShowImage(image,0,0,w=160,h=120)
		LCD.display_window(image,
						  0,
						  0,
						  160,
						  108)
		#LCD_Config.Driver_Delay_ms(25)
		
	def getValue(self):
		global chan
		#time.sleep(0.1)
		return abs(chan.value)
		
	def sendEvent(self,sensor_reading):
		ts=time.time()
		print ("SENDING DATA {}, {}".format(sensor_reading, time.ctime(ts)))
		post_data = { 'request_data': [ { 'acp_id': SENSOR_ID,
										  'acp_type': SENSOR_TYPE,
										  'acp_ts': ts,
										  'intensity': sensor_reading,
										  'acp_units': 'vibration_level'
														 }
													  ]
									}
		self.send_data(post_data, ACP_TOKEN)
		
		if DEBUG_LOG:
			 print("loop send data at {:.3f} secs.".format(time.process_time() - t_start))

	def goodbye_screen(self):
		image=Image.new("RGB", (DISPLAY_WIDTH, DISPLAY_HEIGHT), "BLACK")
		draw = ImageDraw.Draw(image)
		draw.text((32,22), "Bye bye", fill="WHITE", font=FONT_BIG)
		LCD.display(image)
		time.sleep(1)
		
	def finish(self):
	   	print("\n"+"GPIO cleanup()...")
	   	GPIO.cleanup()
	   	print("Bye bye")
	   	sys.exit()
	
	def loop(self):
		now = time.time()
		prev_time = now
		
		while True:
			try:
				intensity=self.getValue()
			   # print(intensity)
				time.sleep(.15)
				self.updateScreenNumeric(intensity)
				self.updateScreenVisual(intensity)
				
				now = time.time() # floating point time in seconds since epoch
				if (now - prev_time > 5) or (intensity>16):
				  self.sendEvent(intensity)
				  prev_time = now
					
			  #  time.sleep(1.0)
				print("{:5} now {}, prev {} ".format(intensity, time.ctime(now)[10:20],time.ctime(prev_time)[10:20]))
			except (KeyboardInterrupt, SystemExit):
				self.goodbye_screen()
				self.finish()
	

	   			
##main code

if __name__ =="__main__":
	g=Sensor()

	g.loop()

	#g.finish()

