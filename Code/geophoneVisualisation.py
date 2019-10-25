import time
import board
import busio
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from matplotlib import style
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

#print("{:>5}\t{:>5}".format('raw', 'v'))

timeValue=[]
dataValue=[]

init=time.time()

plt.ion()

def makeGraph():
    #only plotting a maximum of fourteen past values
    if(len(timeValue)>14):
        #delete the oldest value in the list
        del timeValue[0:1]
        del dataValue[0:1]
    
    #adding new values to the list
    timeValue.append(int(time.time()-init))
    dataValue.append(abs(chan.value))
    
    # plot a line for each set of data
    plt.plot(timeValue,dataValue) 
    plt.draw()

    plt.show()
    
    # pause and update the graph
    plt.pause(0.0001)
    plt.clf()

def loop():
    
    while True:
        
        #pause for the next value
        time.sleep(0.1)
        
        print(abs(chan.value))
        
        #display changes in realtime
        makeGraph()

loop()