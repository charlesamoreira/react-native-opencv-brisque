import React, {useState, useEffect, useRef} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import {
  Camera,
  CameraPermissionRequestResult,
  useCameraDevices,
} from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import OpenCV from './NativeModules/OpenCV';

export default function App() {
  const camera = useRef<Camera>(null);
  const [cameraPermission, setCameraPermission] =
    useState<CameraPermissionRequestResult>();
  const [message, setMessage] = useState<string>();
  const [photoPath, setPhotoPath] = useState<string>();

  useEffect(() => {
    (async () => {
      const cameraPermissionStatus = await Camera.requestCameraPermission();
      setCameraPermission(cameraPermissionStatus);
    })();
  }, []);

  const devices = useCameraDevices();
  const cameraDevice = devices.back;

  const checkForBlurryImage = (imageAsBase64: any) => {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'android') {
        OpenCV.checkForBlurryImage(
          imageAsBase64,
          (error: any) => {
            reject(error);
          },
          (msg: any) => {
            console.log(msg);
            resolve(msg);
          },
        );
      } else {
        OpenCV.checkForBlurryImage(
          imageAsBase64,
          (error: any, dataArray: any) => {
            if (error) {
              reject(error);
            } else {
              resolve(dataArray[0]);
            }
          },
        );
      }
    });
  };

  // const checkBlurScore = (file: any) => {
  //   return new Promise((resolve, reject) => {
  //     if (Platform.OS === 'android') {
  //       OpenCV.checkBlurScore(
  //         file,
  //         (error: any) => {
  //           reject(error);
  //         },
  //         (score: any) => {
  //           console.log(score);
  //           resolve(score);
  //         },
  //       );
  //     } else {
  //       OpenCV.checkBlurScore(file, (error: any, dataArray: any) => {
  //         if (error) {
  //           reject(error);
  //         } else {
  //           resolve(dataArray[0]);
  //         }
  //       });
  //     }
  //   });
  // };

  const handleTakePhoto = async () => {
    try {
      if (camera.current) {
        const photo = await camera.current.takePhoto();

        RNFS.readFile(`file://${photo.path}`, 'base64').then(base64 => {
          checkForBlurryImage(base64)
            .then(blurryPhoto => {
              if (blurryPhoto) {
                setMessage(`${blurryPhoto} Photo is blurred!`);
              } else {
                setMessage(`${blurryPhoto} Photo is clear!`);
              }
              setPhotoPath(`file://${photo.path}`);
            })
            .catch(err => {
              setMessage(err);
              console.log('err', err);
            });

          // checkBlurScore(base64)
          //   .then(score => {
          //     setMessage(`Brisque Score ${score}`);

          //     setPhotoPath(`file://${photo.path}`);
          //   })
          //   .catch(err => {
          //     setMessage(err);
          //     console.log('err', err);
          //   });
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  const renderTakingPhoto = () => {
    return (
      <View>
        {cameraDevice && !photoPath && (
          <>
            <Camera
              ref={camera}
              style={[styles.camera, styles.photoAndVideoCamera]}
              device={cameraDevice}
              isActive
              photo
            />

            <TouchableOpacity style={styles.btn} onPress={handleTakePhoto}>
              <Text style={styles.btnText}>Take Photo</Text>
            </TouchableOpacity>
          </>
        )}
        <Text style={styles.barcodeText}>{message}</Text>
        {photoPath && (
          <>
            <Image style={styles.image} source={{uri: photoPath}} />
            <TouchableOpacity
              style={styles.btn}
              onPress={() => setPhotoPath(undefined)}>
              <Text style={styles.btnText}>Take New Photo</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (cameraDevice == null) {
      return <ActivityIndicator size="large" color="#1C6758" />;
    }
    if (cameraPermission !== 'authorized') {
      return null;
    }
    return renderTakingPhoto();
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.saveArea}>
        <View style={styles.header}>
          <Text style={styles.headerText}>React Native OpenCV Blur</Text>
        </View>
      </SafeAreaView>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF2E6',
  },
  saveArea: {
    backgroundColor: '#3D8361',
    marginBottom: 20,
  },
  header: {
    height: 50,
    backgroundColor: '#3D8361',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: '#ffffff',
    fontSize: 20,
  },
  caption: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionText: {
    color: '#100F0F',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    height: 460,
    width: '92%',
    alignSelf: 'center',
  },
  photoAndVideoCamera: {
    height: 360,
  },
  barcodeText: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    textAlign: 'center',
    color: '#100F0F',
    fontSize: 24,
  },
  pickerSelect: {
    paddingVertical: 12,
  },
  image: {
    marginHorizontal: 16,
    paddingTop: 8,
    height: 460,
    width: '92%',
    alignSelf: 'center',
  },
  dropdownPickerWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 9,
  },
  btnGroup: {
    margin: 16,
    flexDirection: 'row',
  },
  btn: {
    backgroundColor: '#63995f',
    margin: 13,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 20,
    textAlign: 'center',
  },
  video: {
    marginHorizontal: 16,
    height: 100,
    width: 80,
    position: 'absolute',
    right: 0,
    bottom: -80,
  },
});
