import sys
sys.path.append('LCD_1in8')
import LCD_1in8
import LCD_Config

from PIL  import Image
from PIL import ImageDraw
from PIL import ImageFont
from PIL import ImageColor

import time
import board
import busio

import adafruit_ads1x15.ads1015 as ADS
from adafruit_ads1x15.analog_in import AnalogIn

# Create the I2C bus
i2c = busio.I2C(board.SCL, board.SDA)

# Create the ADC object using the I2C bus
ads = ADS.ADS1015(i2c)

# Create single-ended input on channel 0
#chan = AnalogIn(ads, ADS.P0)

# Create differential input between channel 0 and 1
chan = AnalogIn(ads, ADS.P0, ADS.P1)
    
LCD = LCD_1in8.LCD()

print ("**********Init LCD**********")

Lcd_ScanDir = LCD_1in8.SCAN_DIR_DFT  #SCAN_DIR_DFT = D2U_L2R
LCD.LCD_Init(Lcd_ScanDir)

image = Image.new("RGB", (LCD.LCD_Dis_Column, LCD.LCD_Dis_Page), "WHITE")
draw = ImageDraw.Draw(image)

print ("***draw line")
draw.line([(0,0),(159,0)], fill = "RED",width = 15)
draw.line([(159,0),(159,127)], fill = "RED",width = 15)
draw.line([(159,127),(0,127)], fill = "RED",width = 15)
draw.line([(0,127),(0,0)], fill = "RED",width = 15)

print ("***draw text")
bigFont = ImageFont.truetype('/usr/share/fonts/truetype/freefont/FreeMonoBold.ttf', 18)
smallFont = ImageFont.truetype('/usr/share/fonts/truetype/freefont/FreeMonoBold.ttf', 10)
draw.text((32, 22), 'Geophone', fill = "BLUE", font = bigFont)
draw.text((45, 40), 'Sensor', fill = "BLUE",font = bigFont)
draw.text((10, 60), 'for footstep detection', fill = "BLUE", font = smallFont)
        
LCD.LCD_ShowImage(image,0,0,w=160,h=128)
LCD_Config.Driver_Delay_ms(1000)

image = Image.new("RGB", (LCD.LCD_Dis_Column, LCD.LCD_Dis_Page), "BLACK")
draw = ImageDraw.Draw(image)
LCD.LCD_ShowImage(image,0,0,w=160,h=128)

def updateScreenNumeric(value):
    value= "Geophone value: "+str(value)
    
    image = Image.new("RGB", (LCD.LCD_Dis_Column, LCD.LCD_Dis_Page), "BLACK")
    draw = ImageDraw.Draw(image)

    draw.text((0, 0), value, fill = "WHITE", font = smallFont)

    LCD.LCD_ShowImage(image,0,120,w=160,h=20)
    LCD_Config.Driver_Delay_ms(250)

def updateScreenVisual(value):
    
    #setup for background
    image = Image.new("RGB", (LCD.LCD_Dis_Column, LCD.LCD_Dis_Page), "BLACK")
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
            
    LCD.LCD_ShowImage(image,0,0,w=160,h=120)
    LCD_Config.Driver_Delay_ms(25)
    
def getValue():
    
    #time.sleep(0.1)
    return abs(chan.value)

def loop():
    while True:
        print(getValue())
        updateScreenNumeric(getValue())
        updateScreenVisual(getValue())

loop()

