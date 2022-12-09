import { StyleSheet, Text, View, Button, SafeAreaView, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { Camera } from 'expo-camera';
import { Video } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import DetectServiceAPI from './detect-service';
import { Table, Row, Rows } from 'react-native-table-component';

export default function App() {

	const [isCam, setIsCam] = useState(false);

    let cameraRef = useRef();
    const [hasCameraPermission, setHasCameraPermission] = useState();
    const [hasMicrophonePermission, setHasMicrophonePermission] = useState();
    const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState();
    const [isRecording, setIsRecording] = useState(false);
    const [video, setVideo] = useState();
	const [photo, setPhoto] = useState();
	const [resDetect, setResDetect] = useState(false);
	const [labelFace, setLabelFace] = useState("");
	const header = ['STT', 'Name']
	const [dataVideo, setDataVideo] = useState([]);
	const [isLoading, setIsLoading] = useState(false);

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

	const requestDetectImage = async () => {
		setIsLoading(true);
		console.log('request to server to detect image')
		const base64 = await FileSystem.readAsStringAsync(photo.uri, { encoding: 'base64' });
		const data = await DetectServiceAPI.detectImage(base64);
		console.log('data receive:', data)
		setIsLoading(false);
		setResDetect(true);
		setLabelFace(data.id);
	}

	const requestDetectVideo = async () => {
		setIsLoading(true);
		console.log('request to server to detect video')
		const base64 = await FileSystem.readAsStringAsync(video.uri, { encoding: 'base64' });
		let data = await DetectServiceAPI.detectVideo(base64);
		console.log('data receive detect video:', data)
		setResDetect(true);
		let stt = 1;
		data = data.slice(1, data.length-1)
		const array = data.split(', ');
		console.log('array: ', array);
		let tmpData = [];
		if ( array[0].length > 0 ) {
			for( let i = 0; i < array.length; i++) {
				const tmp = [stt, array[i].slice(1, array[i].length-1)];
				tmpData.push(tmp);
				stt++;
			}
		}
		setIsLoading(false);
		setDataVideo(tmpData);
		console.log('data Video', tmpData)
	}

	const again = () => {
		setPhoto(undefined)
		setVideo(undefined);
		setResDetect(false);
	}

	if ( photo ) {

		let savePhoto = async () => {
			await MediaLibrary.saveToLibraryAsync(photo.uri);
		};

		return (
			<SafeAreaView style={styles.containerTmp}>
				<Image style={{height: '95%', width: '100%'}} source={{uri: photo.uri}} />
				{isLoading && <ActivityIndicator style={{position: 'absolute'}} size={60} color="#FF5A80" />}
				{!resDetect &&<View style={styles.btnAfter}>
					{
						hasMediaLibraryPermission && <TouchableOpacity style={styles.btnSave} onPress={() => savePhoto()}>
							<Text>SAVE</Text>
						</TouchableOpacity>
					}
					<TouchableOpacity style={styles.btnDetect} onPress={() => requestDetectImage()}>
						<Text>DETECT</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.btnDiscard} onPress={() => setPhoto(undefined)}>
						<Text>DISCARD</Text>
					</TouchableOpacity>
				</View>}
				{resDetect && <View style={styles.btnRes}>
					<Text>LABEL: {labelFace}</Text>	
					<TouchableOpacity style={styles.btnDiscard} onPress={again}>
						<Text>AGAIN</Text>
					</TouchableOpacity>
				</View>}
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
				{ !resDetect && <Video
					style={styles.video}
					source={{uri: video.uri}}
					useNativeControls
					resizeMode='contain'
					isLooping
				/> }
				{isLoading && <ActivityIndicator style={{position: 'absolute'}} size={60} color="#FF5A80" />}
				{!resDetect && <View style={styles.btnAfter}>
					{
						hasMediaLibraryPermission && <TouchableOpacity style={styles.btnSave} onPress={() => saveVideo()}>
							<Text>SAVE</Text>
						</TouchableOpacity>
					}
					<TouchableOpacity style={styles.btnDetect} onPress={() => requestDetectVideo()}>
						<Text>DETECT</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.btnDiscard} onPress={() => setVideo(undefined)}>
						<Text>DISCARD</Text>
					</TouchableOpacity>
				</View>}
				{resDetect && <ScrollView nestedScrollEnabled={true} style={{marginTop: '20%'}}>
					<Text style={{fontWeight: '900', color:'red'}}>LIST LABEL ({dataVideo.length} people): </Text>	
					<Table borderStyle={{borderWidth: 1, borderColor: '#FF5A80'}}>
						<Row data={header} />
						{
							dataVideo.map((dataRow, index) => (
								<Row
									key={index}
									data={dataRow}
									style={[styles.row, index%2 && {backgroundColor: '#ffffff'}]}
									textStyle={styles.text}
								/>
							))
						}
					</Table>
					<TouchableOpacity style={styles.btnDiscard} onPress={again}>
						<Text>AGAIN</Text>
					</TouchableOpacity>
				</ScrollView>}
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
	btnRes: {
		marginTop: '2%',
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
