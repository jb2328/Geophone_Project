#! /usr/bin/python3

# for dev / debug
DEBUG_LOG = False

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

from time_buffer import TimeBuffer

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

runMain=None
runInterrupt=None
allowInterrupt=None

EVENT_S="START"
EVENT_F="FINISH"


class Sensor(object):
        def __init__(self):
               global LCD
               global chan
               
               global runMain
               global runInterrupt
               global allowInterrupt
               
               self.SAMPLE_HISTORY_SIZE = 100000
               self.SAMPLE_EVENT_SIZE = 30
               
               self.sample_history_index = 0
               self.sample_history = [None]*self.SAMPLE_HISTORY_SIZE

               #DON'T FORGET TO ADD SETTIGNS
               self.sample_buffer = TimeBuffer(size=self.SAMPLE_HISTORY_SIZE, settings={"LOG_LEVEL":0})
               self.event_buffer = TimeBuffer(size=self.SAMPLE_EVENT_SIZE, settings=None)

               self.event_buffer.put(time.time(),"Begin")
               

               self.prev_lcd_update= None
               self.prev_send_time=None

               self.last_save=time.time()
               
               #load config here if have it
               LCD=self.init_lcd()
               chan=self.init_geophone()
               PIN=26
               self.initScreenNumeric()

               self.last_event=None
               self.last_sent=None
               self.mid_event=False;
               
               GPIO.setup(PIN,GPIO.IN)
               
               def mic_callback(PIN):
                   if GPIO.input(PIN):
                     self.sendEventMic()
                      # print(str(time.time())+" 1")
               
               GPIO.add_event_detect(PIN, GPIO.RISING, bouncetime=300)#detects if PIN high or low
               
               GPIO.add_event_callback(PIN, callback=mic_callback)

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

               CHART_CONFIG={"x":0,"y":0,"w":161,"h":60,"step":1}
               self.chart= LCD.add_bar(CHART_CONFIG)
               
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

        def initScreenNumeric(self):
               text= "Geophone value: "# +str(value)
                       
               image = Image.new("RGB", (160,20), COLOR_BG)
               draw = ImageDraw.Draw(image)
                
               draw.text((0, 0), text, fill = "WHITE", font = FONT_SMALL)
                
                       #LCD.LCD_ShowImage(image,0,120,w=160,h=20)
               LCD.display_window(image,
                                           0,
                                           110,
                                           160,
                                           18)
                                           
        def updateScreenNumeric(self,value):
               value= str(value)
               w=20
               h=10
               image = Image.new("RGB", (w,h), COLOR_FG)
               draw = ImageDraw.Draw(image)
        
               draw.text((0, 0), value, fill = "BLACK", font = FONT_SMALL)
        
               #LCD.LCD_ShowImage(image,0,120,w=160,h=20)
               #FIX THIS
               LCD.display_window(image,
                                   90, #begin
                                   110,
                                   w,#end
                                   h)
        
               #LCD_Config.Driver_Delay_ms(250)

        
               
        def intensityBar(self, level):
               lineThick=10
                     #setup for background
               image = Image.new("RGB", (DISPLAY_WIDTH, 50), COLOR_BG)
               draw = ImageDraw.Draw(image)
               colors=[(0,0,0),(0,200,0),(250,250,0),(255,100,0),(255,0,0),(100,0,0)]

               initY=-lineThick/2
               for i in range(level):
                     draw.line([(0,initY),(160,initY)], fill =colors[i] ,width = lineThick)
                     initY+=lineThick

               LCD.display_window(image,
                                      0,
                                      60,
                                      160,
                                      100)
        
               
        def updateIntensityBar(self,value):
               
               if(value<=16):
                          self.intensityBar(1)
                          
               if(value>16 and value<=48):
                     self.intensityBar(2)

               #draw dark green, light green, yellow
               if(value>48 and value<=128):
                     self.intensityBar(3)

               #draw dark green, light green, yellow, orange
               if(value>128 and value<=512):
                     self.intensityBar(4)
               
               #draw dark green, light green, yellow, orange, red
               if(value>512 and value<=1024):
                     self.intensityBar(5)         
                     #draw dark green, light green, yellow, orange, red, dark red
               if(value>1024):
                     self.intensityBar(6)

        def update_lcd(self,ts):
            global LCD
            t_start=time.process_time()
                                  
            if((self.prev_lcd_update is None) or (ts-self.prev_lcd_update>0.5)):

               # sample_value, offset = self.sample_buffer.median(0,0.25)
                sample_value=0
                #get median weight for 1s
                if not sample_value ==  None:
                    
                    if sample_value>16:
                        sample_value=int(sample_value)
                        self.updateScreenNumeric(sample_value)
                        self.updateIntensityBar(sample_value)
                        self.updateScreenNumeric(sample_value)
                         
                self.prev_lcd_update=ts
                
       
           
            #self.chart.next(latest_sample["value"]/2)
            latest_sample=self.sample_buffer.get(0)
            if not latest_sample == None:
                latest_sample=latest_sample["value"]
                        
                self.chart.next(latest_sample/2)
            
        def getValue(self):
            global chan
            #time.sleep(0.1)
            return abs(chan.value)

        def latest_buffer_val(self):
            sample_value, offset = self.sample_buffer.median(0,0.35)
             #get median weight for 1s
            latest_sample=self.sample_buffer.get(0)["value"]
            #print(sample_value, latest_sample)
            if (not sample_value== None) and (not latest_sample==None):
                 if(sample_value>latest_sample):
                    return  sample_value
                 else:
                    return latest_sample
            else:
                return None

             
        #true if median for 1s is more than 16 or mic==1
        #Returns tuple <Test true/false>, <next offset>
        def test_walk(self,offset,duration):
           # m,next_offset=self.sample_buffer.median(offset,duration)
            
            #print(m, next_offset)
            if duration ==2:
                n,next_offset2=self.sample_buffer.median(offset,duration)
                
                return n,next_offset2
            else:
                m,next_offset=self.sample_buffer.median(offset,duration)
                
            if not m==None and m>16: #if not m==None
                #return (m>16), next_offset
                return m, next_offset
            else:
                return None, None #none none
                
        def test_event_new(self,offset, duration):
            walked, offset=self.test_walk(offset, duration)
            #deleted additinal if statement from sensor.y
            if walked:
                return walked
            else:
                return None

            
        def test_event(self, ts):
            event_S=self.test_event_new(0,0.25)
            event_F=self.test_event_new(0,2)
           # ts=time.time()

            print("S,F: ", event_S,event_F)    

            #Catch beginning of event
            if not event_S is None:
               # print("event delta ", event_S-16)
                
                if (event_S>31 and self.event_buffer.get(0)["value"]!=EVENT_S):
                    print("NEW Started")
                    self.event_buffer.put(ts,EVENT_S)
                    self.send_event(ts,EVENT_S)

            if not event_F is None:
                if(event_F<=8 and self.event_buffer.get(0)["value"]!=EVENT_F and self.event_buffer.get(0)["value"]!="Begin"):
                    if event_S is None:
                        print("NEW Finished")
                        self.event_buffer.put(ts,EVENT_F)
                        self.send_event(ts,EVENT_F)
                        
                        
#                   self.mid_event=False      
            for i in range(self.SAMPLE_EVENT_SIZE):
                if not self.event_buffer.get(i) is None:
                    print(self.event_buffer.get(i))
            #return event

        def process_sample(self, ts,value):
           
            t_start= time.process_time()

            #value=self.getValue()
            
            #store reading and timestamp in the buffer
            self.sample_buffer.put(ts,value)

            #save to buffer csv file
           # if (ts-self.last_save)>60:
        #       self.sample_buffer.save("Wednesday_morning.csv")
      #         self.last_save=time.time()
    #           print("SAVED")
                                
                     #update the screen
            self.update_lcd(ts)

            #send event to platform
            self.test_event(ts)

            if self.prev_send_time is None:
                self.prev_send_time=ts
                
            if ts-self.prev_send_time>30:
                sample_value, offset = self.sample_buffer.median(0,2) # from latest ts, back 2s

                if not sample_value==None:
                    #print("SENDING READING {:5.1f},{}".format(sample_value, time.ctime(ts)))
                   # print(sample_value)
                   # self.send_data(ts, str(sample_value))
                    self.prev_send_time =ts

                else:
                    print("process_sample send data at {:5.3f} secs".format(time.process_time()-t_start))

#--------------------------------------#
#---------------OLD LOOP---------------#
#--------------------------------------#

        def loop(self):
               now = time.time()
               self.prev_send_time = now
               self.prev_lcd_update= now

               self.initScreenNumeric()
               
               global runInterrupt
               global runMain
               global allowInterrupt

               runMain=True
               runInterrupt=False
               allowInterrupt=True
               

               while True:
                     try:
                          now = time.time() # floating point time in seconds since epoch
                          #try:
                          if(runInterrupt==False):

                              allowInterrupt=False

                              if DEBUG_LOG:
                                 print("Main Reading Started (Interrupts not allowed)")

                              intensity=self.getValue()
                              allowInterrupt=True

                              if DEBUG_LOG:
                                 print("Main Reading Finished (Interrupts allowed)")

                            
                          #except:
                          #else:
                          #    intensity=0
                              
                          self.chart.next(intensity/2)
                          
                          if (now-self.prev_lcd_update >0.15):
                              self.updateIntensityBar(intensity)
                              self.updateScreenNumeric(intensity)
                              self.prev_lcd_update=time.time()
                          
                          if (now - self.prev_send_time > 5) or (intensity>32):
                              self.send_event(now,intensity)
        
                       #  time.sleep(1.0)
                          #print("{:5} now {}, prev {} ".format(intensity, time.ctime(now)[10:20],time.ctime(prevEventSent)[10:20]))
                     #    print("loop finished at {:.3f} secs.".format(time.process_time() - t_start))
                     except (KeyboardInterrupt, SystemExit):
                          self.goodbye_screen()
                          self.finish()
        
        def send_event(self,ts,sensor_reading):
               
               print ("SENDING DATA {}, {}".format(sensor_reading, time.ctime(ts)))
               post_data = { 'request_data': [ { 'acp_id': SENSOR_ID,
                                                     'acp_type': SENSOR_TYPE,
                                                     'acp_ts': ts,
                                                     'intensity': sensor_reading,
                                                     'acp_units': 'vibration_level',
                                                     'mic_reading':0
                                                                      }
                                                                    ]
                                            }
               self.send_data(post_data, ACP_TOKEN)
               self.prev_send_time = ts              
              # time.sleep(0.1)
               
               if DEBUG_LOG:
                      print("loop send data at {:.3f} secs.".format(time.process_time() - t_start))
                      
        def sendEventMic(self):
        
               intensity=self.latest_buffer_val()
               ts=time.time()         
                            
               print ("SENDING DATA {}, {}, {}".format(intensity, 1, time.ctime(ts)))
               post_data = { 'request_data': [ { 'acp_id': SENSOR_ID,
                                                           'acp_type': SENSOR_TYPE,
                                                           'acp_ts': ts,
                                                           'intensity': intensity,
                                                           'acp_units': 'vibration_level',
                                                           'mic_reading':1
                                                                        }
                                                                       ]
                                                   }
               self.send_data(post_data, ACP_TOKEN)

                 
               
                          
        def sendEventMic_OLD(self):

               if DEBUG_LOG:
                     print("Attempting Interrupt Start ")

               global runMain
               global runInterrupt
               global allowInterrupt 

               if(allowInterrupt):

                     runMain=False
                     runInterrupt=True

                     if DEBUG_LOG:
                          print("Interrupt allowed, Main stopped ")
                          print("Interrupt Reading Start")

                     intensity=self.getValue()

                     if DEBUG_LOG:
                          print("Interrupt Reading Finished") #sampling getValue() too often can cause an IO error
                     
                     ts=time.time()                      

                     print ("SENDING DATA {}, {}, {}".format(intensity, 1, time.ctime(ts)))
                     post_data = { 'request_data': [ { 'acp_id': SENSOR_ID,
                                                           'acp_type': SENSOR_TYPE,
                                                           'acp_ts': ts,
                                                           'intensity': intensity,
                                                           'acp_units': 'vibration_level',
                                                           'mic_reading':1
                                                                        }
                                                                       ]
                                                   }
                     self.send_data(post_data, ACP_TOKEN)

                    # time.sleep(0.1)

                     if DEBUG_LOG:
                          print("Back to Main, Interrupt finished ")

                     runInterrupt=False
                     runMain=True
                     
                     if DEBUG_LOG:
                           print("loop send data at {:.3f} secs.".format(time.process_time() - t_start))
               else:
                     if DEBUG_LOG:
                          print("Interrupt not allowed")
        

        def goodbye_screen(self):
               image=Image.new("RGB", (DISPLAY_WIDTH, DISPLAY_HEIGHT), "BLACK")
               draw = ImageDraw.Draw(image)
               draw.text((32,22), "Bye bye", fill="WHITE", font=FONT_BIG)
               LCD.display(image)
               time.sleep(1)
               
        def finish(self):

            self.goodbye_screen()
            
            print("\n"+"SPI cleanup()...")
            LCD.cleanup()
            print("\n"+"GPIO cleanup()...")
            GPIO.cleanup()
            print("Bye bye")
            sys.exit()
                    
##main code

def loop():
        
        g=Sensor()
        counter=0
        LOOP_TIME=0.05
        try:
               while True:
                     start_time=time.time()
                     value=g.getValue()
                     g.process_sample(start_time, value)
                     now=time.time()
                     foo=LOOP_TIME-(now-start_time)
                     if foo>0:
                          time.sleep(foo)
        except (KeyboardInterrupt, SystemExit):
               pass
               g.finish()

def test():
    s = Sensor()

# for playback we can specify
#   sleep=0.1 for a fixed period between samples
# or
#   realtime=True which will pause the time between recorded sample timestamps.
# otherwise the playback will be as fast as possible.
    t = TimeBuffer(size=6000, settings={"LOG_LEVEL":0})
    print("loading buffer")
    t.load('CSVs/sensor_play.csv')
    print("loaded data")
    
    t.play(s.process_sample, realtime=False)

if __name__ =="__main__":

        #loop()
        test()
        #g.loop()
       

