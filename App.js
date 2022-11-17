import { StyleSheet, Text, View, Button, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { Camera } from 'expo-camera';
import { Video } from 'expo-av';
import { shareAsync } from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

export default function App() {

	const [isCam, setIsCam] = useState(false);

    let cameraRef = useRef();
    const [hasCameraPermission, setHasCameraPermission] = useState();
    const [hasMicrophonePermission, setHasMicrophonePermission] = useState();
    const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState();
    const [isRecording, setIsRecording] = useState(false);
    const [video, setVideo] = useState();
	const [photo, setPhoto] = useState();

    useEffect(() => {
		if ( isCam ) {
			(async () => {
				const cameraPermission = await Camera.requestCameraPermissionsAsync();
				const microphonePermission = await Camera.requestMicrophonePermissionsAsync();
				const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
	
				setHasCameraPermission(cameraPermission.status === "granted");
				setHasMicrophonePermission(microphonePermission.status === "granted");
				setHasMediaLibraryPermission(mediaLibraryPermission.status === "granted");
			})();
		}
    }, [isCam]);

    let recordVideo = () => {
		setIsRecording(true);
		let options = {
			quality: "1080p",
			maxDuration: 60,
			mute: false
		};

		cameraRef.current.recordAsync(options).then((recordedVideo) => {
			setVideo(recordedVideo);
			setIsRecording(false);
		});
    };

    let stopRecording = () => {
		setIsRecording(false);
		cameraRef.current.stopRecording();
    };

	let takePhoto = async () => {
		const options = { quality: 0.5, base64: true, skipProcessing: true };
		await cameraRef.current.takePictureAsync().then((photo) => {
			console.log(photo.uri);
			setPhoto(photo);
		})
		// await cameraRef.current.pausePreview();
	}

	const requestDetect = () => {
		console.log('request to server to detect')
	}

	if ( photo ) {

		let savePhoto = async () => {
			await MediaLibrary.saveToLibraryAsync(photo.uri);
		};

		return (
			<SafeAreaView style={styles.containerTmp}>
				<Image style={{height: '95%', width: '100%'}} source={{uri: photo.uri}} />
				<View style={styles.btnAfter}>
					{
						hasMediaLibraryPermission && <TouchableOpacity style={styles.btnSave} onPress={() => savePhoto()}>
							<Text>SAVE</Text>
						</TouchableOpacity>
					}
					<TouchableOpacity style={styles.btnDetect} onPress={() => requestDetect()}>
						<Text>DETECT</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.btnDiscard} onPress={() => setPhoto(undefined)}>
						<Text>DISCARD</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		)
	}

    if (video) {

		let saveVideo = () => {
			MediaLibrary.saveToLibraryAsync(video.uri).then(() => {
				setVideo(undefined);
			});
		};

		return (
			<SafeAreaView style={styles.containerTmp}>
				<Video
					style={styles.video}
					source={{uri: video.uri}}
					useNativeControls
					resizeMode='contain'
					isLooping
				/>
				<View style={styles.btnAfter}>
					{
						hasMediaLibraryPermission && <TouchableOpacity style={styles.btnSave} onPress={() => saveVideo()}>
							<Text>SAVE</Text>
						</TouchableOpacity>
					}
					<TouchableOpacity style={styles.btnDetect} onPress={() => requestDetect()}>
						<Text>DETECT</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.btnDiscard} onPress={() => setVideo(undefined)}>
						<Text>DISCARD</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
    }

	const getCam = () => {
		setIsCam(true)
	}

	const back = () => {
		if(isRecording) {
			stopRecording();
			setVideo(undefined)
		}
		setIsCam(false)
	}

	const renderCamera = () => {
		return (
			isCam && (<Camera style={styles.container} ref={cameraRef}>
				<View style={styles.btnVideo}>
					<TouchableOpacity onPress={isRecording ? stopRecording : recordVideo} style={styles.btnRecord}>
						<Text>{isRecording ? "Stop Recording" : "Record Video"}</Text>
					</TouchableOpacity>
					{
						!isRecording && (
							<TouchableOpacity onPress={takePhoto} style={styles.btnTakePhoto}>
								<Text>Take photo</Text>
							</TouchableOpacity>
						)
					}
					<TouchableOpacity onPress={() => back()} style={styles.btnBack}>
						<Text>BACK</Text>
					</TouchableOpacity>
				</View>
			</Camera> )
		);
	}

	return (
		<View style={styles.content}>
			{!isCam &&<View style={styles.header}></View>}
			{!isCam && (
				<TouchableOpacity onPress={() => getCam()} style={styles.btnGetCam}>
					<Text style={{color: '#FFFFFF', textAlign:'center'}}>GET CAMERA</Text>
				</TouchableOpacity>
			)}
			{renderCamera()}
		</View>
    );
    
  }

  const styles = StyleSheet.create({
	content: {
		display: 'flex',
		// alignItems: 'center',
		// justifyContent: 'center'
	},	
	header: {
		height: 100,
	},	
    container: {
		// flex: 1,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		height: '100%'
    },
	containerTmp: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
    },
	btnGetCam: {
		backgroundColor: '#FF5A80',
		width: '30%',
		padding: 10,
		alignSelf:'center',
		borderRadius: 10
	},	
    buttonContainer: {
		backgroundColor: "gray",
		alignSelf: "flex-end"
	},
    video: {
		flex: 1,
		alignSelf: "stretch"
    },
	btnVideo: {
		display: 'flex',
		flexDirection: 'row',
		marginTop: '170%',
		justifyContent: 'space-between'
	},
	btnRecord: {
		backgroundColor: '#FF5A80',
		padding: 15,
		borderRadius: 15
	}, 
	btnTakePhoto: {
		marginLeft: 10,
		marginRight: 10,
		backgroundColor: '#FF5A80',
		padding: 15,
		borderRadius: 15
	},
	btnBack: {
		backgroundColor: 'gray',
		padding: 15,
		borderRadius: 15
	},
	btnAfter: {
		display: 'flex',
		flexDirection: 'row',
		width: '90%',
		justifyContent: 'space-around',
		marginBottom: '5%'
	},
	btnSave: {
		backgroundColor: '#5db8f0',
		padding: 10,
		borderRadius: 10
	},
	btnDetect: {
		backgroundColor: '#FF5A80',
		padding: 10,
		borderRadius: 10
	},
	btnDiscard: {
		backgroundColor: '#a1abad',
		padding: 10,
		borderRadius: 10
	}
});
