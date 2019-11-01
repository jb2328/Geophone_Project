import time
import board
import busio
import sys

from st7735_ijl20.st7735 import ST7735

from PIL  import Image
from PIL import ImageDraw
from PIL import ImageFont
from PIL import ImageColor


# LCD panel size in pixels (0,0) is top left
DISPLAY_WIDTH = 160                # LCD panel width in pixels
DISPLAY_HEIGHT = 128               # LCD panel height

COLOR_FG = "WHITE"
COLOR_BG = "BLACK"


FONT_BIG = ImageFont.truetype('fonts/truetype/freefont/FreeMonoBold.ttf', 20)
FONT_SMALL = ImageFont.truetype('fonts/truetype/freefont/FreeMonoBold.ttf', 10)

LCD = ST7735()

print ("**********Init LCD**********")

#Lcd_ScanDir = LCD_1in8.SCAN_DIR_DFT  #SCAN_DIR_DFT = D2U_L2R
#LCD.LCD_Init(Lcd_ScanDir)

LCD.begin()

image = Image.new("RGB", (DISPLAY_WIDTH, DISPLAY_HEIGHT), COLOR_FG)
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
LCD.display(image)

time.sleep(1)

image = Image.new("RGB", (DISPLAY_WIDTH, DISPLAY_HEIGHT), COLOR_BG)
draw = ImageDraw.Draw(image)

#LCD.LCD_ShowImage(image,0,0,w=160,h=128)
LCD.display(image)

def updateScreenNumeric(value):
    value= "Test value: 
    
    image = Image.new("RGB", (160,20), COLOR_BG)
    draw = ImageDraw.Draw(image)

    draw.text((0, 0), value, fill = "WHITE", font = FONT_SMALL)

    #LCD.LCD_ShowImage(image,0,120,w=160,h=18)
    LCD.display_window(image,0,110,160,18)