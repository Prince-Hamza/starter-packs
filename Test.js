import { View, Text, TouchableOpacity  } from 'react-native';
import React, { useEffect, useState , useRef} from 'react';
import BackgroundService from 'react-native-background-actions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
const sleep = (time) => new Promise((resolve) => setTimeout(() => resolve(), time));

const Test = () => {
  const backgroundServiceRef = useRef(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [longitude,setLongitude] = useState("")
  const [latitude,setlatitude] = useState("")
  const getCurrentPosition = async () => {
    let position;
    Geolocation.getCurrentPosition(
      (pos) => {
        position = pos;
        const { longitude, latitude } = position.coords;
        console.log("Longitude:", longitude);
        console.log("Latitude:", latitude);
        setLongitude(longitude);
        setlatitude(latitude);
      },
      (error) => Alert.alert('GetCurrentPosition Error', JSON.stringify(error)),
      { enableHighAccuracy: true }
    );
  };

  const veryIntensiveTask = async (taskDataArguments) => {
    // Example of an infinite loop task
    const { delay } = taskDataArguments;
    await new Promise(async (resolve) => {
      for (let i = 0; BackgroundService.isRunning(); i++) {
        await getCurrentPosition();
        console.log(i);
        await BackgroundService.updateNotification({ taskDesc: 'Location fetching' });
        await sleep(delay);
      }
    });
  };

  const options = {
    taskName: 'Example',
    taskTitle: 'ExampleTask title',
    taskDesc: 'ExampleTask description',
    taskIcon: {
      name: 'ic_launcher',
      type: 'mipmap',
    },
    color: '#ff00ff',
    linkingURI: 'yourSchemeHere://chat/jane', // 
    parameters: {
      delay: 5000,
    },
  };

  const stopBackGourndService = async () => {
    await BackgroundService.stop();
    backgroundServiceRef.current = null;
    try {
      await AsyncStorage.setItem('isApp', JSON.stringify(null));
      setIsAppInstalled(false);
    } catch (error) {
      console.error('AsyncStorage error:', error);
    }
  };

  const startBackGroundService = async () => {
    if (!isAppInstalled && !backgroundServiceRef.current) {
      backgroundServiceRef.current = await BackgroundService.start(veryIntensiveTask, options);
      await BackgroundService.updateNotification({ taskDesc: 'Location fetching' });
      setIsAppInstalled(true);
      try {
        await AsyncStorage.setItem('isApp', JSON.stringify(true));
      } catch (error) {
        console.error('AsyncStorage error:', error);
      }
    }
  };

  useEffect(() => {
    const checkAppInstalled = async () => {
      try {
        const value = await AsyncStorage.getItem('isApp');
        if (!value || value === 'null') {
          setIsAppInstalled(false);
          startBackGroundService();
        } else {
          setIsAppInstalled(true);
        }
      } catch (error) {
        console.error('AsyncStorage error:', error);
      }
    };

    checkAppInstalled();

  }, []);

  useEffect(()=>{
    getCurrentPosition()
  },[])
  return (
    <View>
      <View>
        <Text>Longitude: {longitude}</Text>
        <Text>Latitude: {latitude}</Text>
      </View>
      <Text>Updates every 30 seconds</Text>
      <TouchableOpacity onPress={stopBackGourndService}>
        <Text>Stop</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Test;
