import time
import board
import busio

import adafruit_ads1x15.ads1015 as ADS
from adafruit_ads1x15.analog_in import AnalogIn

import sys
#sys.path.append('LCD_1in8')
#import LCD_1in8
#import LCD_Config

sys.path.append('LCD_ST7735')
from LCD_ST7735 import LCD_ST7735

# LCD panel size in pixels (0,0) is top left
DISPLAY_WIDTH = 160                # LCD panel width in pixels
DISPLAY_HEIGHT = 128               # LCD panel height

# Pixel size and coordinates of the 'Weight' display
DISPLAY_WEIGHT_HEIGHT = 128
DISPLAY_WEIGHT_WIDTH = 160
DISPLAY_WEIGHT_COLOR_FG = "WHITE"
DISPLAY_WEIGHT_COLOR_BG = "BLACK"
DISPLAY_WEIGHT_COLOR_BAR = 20
DISPLAY_WEIGHT_X = 0
DISPLAY_WEIGHT_Y = 0
DISPLAY_WEIGHT_RIGHT_MARGIN = 10


FONT_BIG = ImageFont.truetype('fonts/truetype/freefont/FreeMonoBold.ttf', 20)
FONT_SMALL = ImageFont.truetype('fonts/truetype/freefont/FreeMonoBold.ttf', 10)

from PIL  import Image
from PIL import ImageDraw
from PIL import ImageFont
from PIL import ImageColor

# Create the I2C bus
i2c = busio.I2C(board.SCL, board.SDA)

# Create the ADC object using the I2C bus
ads = ADS.ADS1015(i2c)

# Create single-ended input on channel 0
#chan = AnalogIn(ads, ADS.P0)

# Create differential input between channel 0 and 1
chan = AnalogIn(ads, ADS.P0, ADS.P1)

# Begin LCD stuff 
#LCD = LCD_1in8.LCD()
LCD = LCD_ST7735()

print ("**********Init LCD**********")

#Lcd_ScanDir = LCD_1in8.SCAN_DIR_DFT  #SCAN_DIR_DFT = D2U_L2R
#LCD.LCD_Init(Lcd_ScanDir)

LCD.begin()

image = Image.new("RGB", (DISPLAY_WEIGHT_WIDTH, DISPLAY_WEIGHT_HEIGHT), DISPLAY_WEIGHT_COLOR_FG)
draw = ImageDraw.Draw(image)

print ("***draw line")
draw.line([(0,0),(159,0)], fill = "RED",width = 15)
draw.line([(159,0),(159,127)], fill = "RED",width = 15)
draw.line([(159,127),(0,127)], fill = "RED",width = 15)
draw.line([(0,127),(0,0)], fill = "RED",width = 15)

print ("***draw text")

draw.text((32, 22), 'Geophone', fill = "BLUE", font = FONT_BIG)
draw.text((45, 40), 'Sensor', fill = "BLUE",font = FONT_BIG)
draw.text((10, 60), 'for footstep detection', fill = "BLUE", font = FONT_SMALL)
        
#LCD.LCD_ShowImage(image,0,0,w=160,h=128)
LCD.display_window(image,
                      DISPLAY_WEIGHT_X,
                      DISPLAY_WEIGHT_Y,
                      DISPLAY_WEIGHT_WIDTH,
                      DISPLAY_WEIGHT_HEIGHT)

#LCD_Config.Driver_Delay_ms(1000)

image = Image.new("RGB", (LCD.LCD_Dis_Column, LCD.LCD_Dis_Page), DISPLAY_WEIGHT_COLOR_BG)
draw = ImageDraw.Draw(image)

#LCD.LCD_ShowImage(image,0,0,w=160,h=128)
LCD.display_window(image,
                      DISPLAY_WEIGHT_X,
                      DISPLAY_WEIGHT_Y,
                      DISPLAY_WEIGHT_WIDTH,
                      DISPLAY_WEIGHT_HEIGHT)

def updateScreenNumeric(value):
    value= "Geophone value: "+str(value)
    
    image = Image.new("RGB", (DISPLAY_WEIGHT_WIDTH, LDISPLAY_WEIGHT_HEIGHT), DISPLAY_WEIGHT_COLOR_BG)
    draw = ImageDraw.Draw(image)

    draw.text((0, 0), value, fill = "WHITE", font = FONT_SMALL)

    #LCD.LCD_ShowImage(image,0,120,w=160,h=20)
    LCD.display_window(image,
                      0,
                      120,
                      160,
                      20)

    #LCD_Config.Driver_Delay_ms(250)

def updateScreenVisual(value):
    
    #setup for background
    image = Image.new("RGB", (DISPLAY_WEIGHT_WIDTH, LDISPLAY_WEIGHT_HEIGHT), DISPLAY_WEIGHT_COLOR_BG)
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
                      110)
    #LCD_Config.Driver_Delay_ms(25)
    
def getValue():
    
    #time.sleep(0.1)
    return abs(chan.value)

def loop():
    while True:
        print(getValue())
        updateScreenNumeric(getValue())
        updateScreenVisual(getValue())

loop()

