/* Includes */
const fs = require('fs');
const {remote, ipcRenderer, desktopCapturer, screen} = require('electron')
const {Menu, MenuItem, app, shell, BrowserWindow, dialog} = remote;
const vex = require('vex-js');
const path = require('path');
const Vue = require('vue/dist/vue.js');

// Custom modules
const file 			  = require('../modules/file/file.js')();

let rootDir = app.getPath('documents')+"/";
document.__dirname = rootDir+"/"+"notes";
vex.registerPlugin(require('vex-dialog'));
vex.defaultOptions.className = 'vex-theme-os';
console.log(rootDir);

function hasClassName(needle, haystack){
	return !!haystack && haystack.split(" ").indexOf(needle) != -1;
}

function linkHandler(){
	console.log("called");
	var aTags = document.querySelectorAll("a[href]");
	var clickBack = function(e){
		console.log(e);
		e.preventDefault();
		shell.openExternal(e.target.href);
		return false;
	};

	for (var i = 0; i < aTags.length; i++) {
		aTags[i].removeEventListener("click", clickBack, false);
		aTags[i].addEventListener("click", clickBack);
	}
}

function init(){

}

init();

Vue.component('projectExplorer', require('../modules/projectExplorer/projectExplorerVue.js'));
Vue.component('scrnsht',         require('../modules/screenshot/screenshotVue.js'));
Vue.component('wbuttons',        require('../modules/windowButtons/windowButtonsVue.js'));

let store = {
	SimpleMDE: require('simplemde'),
	document: document,
	BrowserWindow: BrowserWindow,
	remote: remote,
	fs: fs,
	pathd: path,
	path : rootDir+'notes',
	filetree: [],
	isWindows: true,
	search: "",
	md: false,
	defaultFile: rootDir+"notes/init.md",
	saveIntervals: null,
	shell:shell,
	acceptedfiles : [
		".md"
	],
	unsaved:true
};

document.explorerFrontend = new Vue({
	el: '.contents',
	data: store,
	mounted(){
		this.md = new this.SimpleMDE({
			element: this.document.getElementById("editor"),
			spellChecker: false,
			shortcuts: {
				drawTable: "Cmd-Alt-T"
			},
		});

		this.md.cmi = require('../modules/codeMirrorImages/codeMirrorImages.js')(this.document,this.md);
		this.md.codemirror.on('change', editor => {
			this.unsaved = true,
			this.md.cmi.checkForImage();
			clearTimeout(this.saveIntervals);
			this.saveIntervals = setTimeout(()=>{
				this.saveCurrentFile();
			},1500);
		});

		this.md.toolbarElements.guide.outerHTML = "";
		this.md.value(this.openFile(this.defaultFile));
		document.md = this.md;
	},
	computed:{
		openedFile(){
			return path.basename(this.defaultFile);
		}
	},
	methods:{
		newFile(){
			this.defaultFile = false;
			this.md.value("");
		},
		openFile(path){
			this.defaultFile = path;
			this.md.value(file.openFile(path));
			console.log("opening file: "+path);
			document.title = "Notable.ink - " + __dirname + "\\." + path;
		},
		rename(oldPath, newPath, callback){
			fs.rename(oldPath, newPath, function (err) {
				if (err) throw err;
				console.log('renamed complete');

				callback();
			});
		},
		saveCurrentFile(){
			this.unsaved = false;
			this.saveFile(this.defaultFile, this.md.value());
			this.md.cmi.checkForImage();
		},
		saveFile(path, contents){
			if(!path){
				let newPath = dialog.showSaveDialog({
					title: "Choose file",
					buttonLabel: "Save",
			        properties: ['openFile']
			    });

			    if(newPath != undefined){
			      	this.saveFile(newPath, contents);
			    }else{
			      alert("Could not save file");
			    }
			    return;
			}

			file.saveFile(path, contents);
			defaultFile = path;
		},
		openFile(path){
			this.defaultFile = path;
			this.md.value(file.openFile(path));
			console.log("opening file: "+path);
			document.title = "Notable.ink - " + __dirname + "\\." + path;
		},
		visit(url){
			shell.openExternal(url);
		},
		pop(text){
			alert(text);
		}
	}
});