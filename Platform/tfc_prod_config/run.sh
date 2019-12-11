#!/bin/bash
#
# Usage:
#  ./run.sh [optional JAR filename]
#
# If no jar filename is given, "./tfc.jar" will be used.
#
# run.sh - run a working set of Adaptive City Platform modules in 'production' mode
#
# start vix modules

# If an argument has been given, use tfc<argument>.jar, e.g. ./run.sh _2017-03-31, and this will use tfc_2017-03-31.jar
# Otherwise run.sh will simply use tfc.jar

# Find the directory this script is being run from, because that will contain the JAR files
# typically "/home/tfc_prod/tfc_prod/"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# set jar filename to arg given on command line OR default to "tfc.jar"
TFC_JAR="dev_configs:target/tfc_server-3.6.3-fat.jar"
#${1:-tfc.jar}

cd $SCRIPT_DIR

# load secrets from secrets.sh if it exists - includes RTMONITOR_KEY
SECRETS_FILE=$SCRIPT_DIR/secrets.sh && test -f $SECRETS_FILE && source $SECRETS_FILE

# CONSOLE
nohup java -cp $TFC_JAR io.vertx.core.Launcher run "service:console.A" -cluster & disown

source secrets.sh;nohup java -cp $TFC_JAR io.vertx.core.Launcher run "service:msgfiler.test_jb" -cluster & disown
source secrets.sh;nohup java -cp $TFC_JAR io.vertx.core.Launcher run "service:feedmaker.test_jb" -cluster & disown
source secrets.sh;nohup java -cp $TFC_JAR io.vertx.core.Launcher run "service:rtmonitor.test_jb" -cluster & disown

