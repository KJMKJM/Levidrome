import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Qs from 'qs';
import * as firebase from 'firebase';
import { Link } from 'react-router-dom';
import { PlayAgain , RandomPair } from './featureButtons';
import List from './list'


// Initialize Firebase
var config = {
apiKey: "AIzaSyBFxEo8gLNFkJ-sw5jCqGnewR3l9YInPs4",
authDomain: "levidromeapp.firebaseapp.com",
databaseURL: "https://levidromeapp.firebaseio.com",
projectId: "levidromeapp",
storageBucket: "",
messagingSenderId: "231325881110"
};
firebase.initializeApp(config);

const key = '10faf101cb01f99e61fe0358e0807373';
//'b7b40e21fdccd7460635c749a5dbb44b'; first key
const id = 'ba5599bf';
//'a31a2791'; first id
const definitionURL = 'entries';
const wordURL = 'inflections';
// let definition = res.data.results[0].lexicalEntries[0].entries[0].senses[0].definitions[0]

export default class LevidromeValidator extends React.Component {
	constructor() {
		super();
		this.state={
			firstWord: '',
			flippedWord: '',
			firstRootWord: '',
			flippedRootWord:'',
			definitions: [],
			word : '',
			pairedWord : '',
			storedItems:[]
		}
		this.getDefinition = this.getDefinition.bind(this);
		this.flipWord = this.flipWord.bind(this);
		this.levidrome = this.levidrome.bind(this);
		this.findRoot = this.findRoot.bind(this);
		this.runRequest = this.runRequest.bind(this);
		this.getFlippedDef = this.getFlippedDef.bind(this);
		this.addToFirebase = this.addToFirebase.bind(this);
	}


	//retrive info from firebase to display in levidrome list
	componentDidMount () {
		const dbRef = firebase.database().ref()

		dbRef.on('value', (firebaseData) => {
			// console.log(firebaseData.val());
			const pairArray = [];
			const levidromeData = firebaseData.val();

			for (let itemsKey in levidromeData) {
				pairArray.push(levidromeData[itemsKey])
			}
			this.setState ({
				storedItems : pairArray
			});
			console.log(this.state.storedItems);
		})
		
	}

	runRequest(urlSection, word) {
		return axios({
			method: 'GET',
			url: 'https://proxy.hackeryou.com',
			dataResponse: 'json',
			paramsSerializer: function (params) {
				return Qs.stringify(params, { arrayFormat: 'brackets' })
			},
			params: {
				reqUrl: `https://od-api.oxforddictionaries.com/api/v1/${urlSection}/en/${word}`,
				proxyHeaders: {
					'header_params': 'value',
					'app_key': key,
					'app_id': id
				},
				xmlToJSON: false
			}
		}).then((result) => {
			return result
		})
		.catch((error) => {
			console.log('errorrrr')
		// IF urlselection = wordURL display not a word therefore not not a levidrome
			// 	// POPUP MODULE TO SAY "word is not valid. Try again"
		});
	}

	// first API request to check if the submitted word is valid or not
	findRoot(word) {
		return this.runRequest(wordURL, word).then((i) => {
			return i.data.results[0].lexicalEntries[0].inflectionOf[0].id
		})
	}

	// get definition function to run request
	getDefinition(word) {
		return this.runRequest(definitionURL, word).then((i) => {
			return i.data.results[0].lexicalEntries[0].entries[0].senses[0].definitions[0]
		})
		// let definition = res.data.results[0].lexicalEntries[0].entries[0].senses[0].definitions[0]
	}

	flipWord(str) {
		var splitString = str.split("");
		var reverseArray = splitString.reverse();
		var flippedWord = reverseArray.join("");
		return flippedWord
	}

	//takes the firstWord from child component
	levidrome(firstWord) {
		// console.log(firstWord)
		this.setState({definitions: []})
		const flippedWord = this.flipWord(firstWord)
		console.log(firstWord)
		console.log(flippedWord)
		//runRequest to verify the entered words are valid.Store the root words, which are the 'id' property into firstRootWord and flippedRootWord and push them into the rootWords Array.
		const firstRootWord = this.findRoot(firstWord)
			.then((firstRoot) => {
				this.setState({
					firstWord,
					flippedWord,
					firstRootWord : firstRoot
				}, () => {
						const firstDef = this.getDefinition(this.state.firstRootWord)
						.then((definition) => {
							// clear array and then push definitions into definition array
							
							const newDef = [];
							newDef.push(definition)
							// console.log('definition', definition);
							this.setState({ definitions : newDef});
							this.getFlippedDef();

						})
					}
				)
			})
		}

		getFlippedDef() {
			const flippedRootWord = this.findRoot(this.state.flippedWord)
			.then((flippedRoot) => {
				// console.log('flippedword', this.state.flippedWord)
					this.setState({
						flippedRootWord: flippedRoot
					}, () => {
						// get definition of flippedRoot
						const flippedDef = this.getDefinition(this.state.flippedRootWord)
						.then((definition2) => {
							// push definition into array

							const newDef2 = Array.from(this.state.definitions);
							// console.log('newDef2 before',newDef2);
							newDef2.push(definition2)
							// console.log('newDef2',newDef2);
							this.setState({ definitions : newDef2})
							console.log(this.state.definitions)
							if (this.state.definitions.length === 2) {
								this.addToFirebase();
							}
						})
					}
				)
			})
		}

		addToFirebase() {
			const dbRef = firebase.database().ref()
			
			dbRef.push(
				{
					firstWord: this.state.firstWord,
					flippedWord: this.state.flippedWord
				}
			);
		}

	render() {
		return (
			<div>
				{/* main input for word */}
				<MainInput submitWord={this.levidrome} />

				<h3> {this.state.flippedWord}</h3>
				{/* adding definitions to page*/}
				 {this.state.definitions.map((definition) => {
					return <p>{definition}</p>
					{console.log(definition)}
					})} 
				
			</div>
		)
	}
}

class MainInput extends React.Component {
	constructor() {
	super();
		this.state = {
			submittedWord: ''
		}
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleChange = this.handleChange.bind(this);
	}

	handleChange(e) {
		this.setState({
				submittedWord: e.target.value,
		})
	}

	handleSubmit(e) {
		e.preventDefault();
		// prop this.state.bothWords to parent
		this.props.submitWord(this.state.submittedWord)
	}

	render() {
		return (
		<div>
			<form action="" 
			onSubmit={this.handleSubmit}>
			<input type="text" 
			className="firstWord" 
			onChange ={this.handleChange}
			value={this.state.firstWord}/>
			<button type="submit">Submit</button>
			</form>
			
          
			{/* <List /> put the levidrome list return function in List eventually */}
			<PlayAgain />
			<RandomPair />

		</div>
		)
	}
}



// //verify word
// this.verifyWord(wordURL, this.state.flippedWord).then((res) => {
// 	console.log(res.data.results[0].lexicalEntries[0].inflectionOf[0].id)
// 	rootword = res.data.results[0].lexicalEntries[0].inflectionOf[0].id;
// 	this.state.rootWords.push(rootword)
// 	console.log(this.state.rootWords)
// })

// // get definitions for first word
// this.getDefinition(definitionURL, this.state.firstWord).then((firstDefinition) => {
// 	firstDefinition = firstDefinition.data.results[0].lexicalEntries[0].entries[0].senses[0].definitions[0]
// 	console.log(firstDefinition)
// 	this.setState({
// 		firstDefinition
// 	})
// })

//Get the word that was typed in and check if it is a real word
// this.verifyWord(wordURL, this.state.firstWord).then((res) => {
// 	console.log(res.data.results[0].lexicalEntries[0].inflectionOf[0].id)
// 	rootword = res.data.results[0].lexicalEntries[0].inflectionOf[0].id;
// 	this.state.rootWords.push(rootword)
// 	console.log(this.state.rootWords)
// })