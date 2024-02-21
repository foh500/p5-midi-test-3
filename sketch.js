let soundSamples = [];
let pitchUnit;
let timeUnit;
let numberOfPitches;
let notes = [];
let creatingNote = false;
let tempNote = null;
let playButton;
let saveButton; 
let loadButton;
let helpButton;
let isPlaying = false;
let timeoutIDs = [];
let isModalOpen = false;

let gridX = 50; // Grid x offset from the canvas edge
let gridY = 50; // Grid y offset from the canvas edge
let gridWidth = 4000; // Width of the grid area
let gridHeight = 400; // Height of the grid area

// Calculate total canvas width and height
let totalCanvasWidth = gridX + gridWidth + 100; // Extra 100 pixels for space on the right
let totalCanvasHeight = gridY + gridHeight + 100; // Extra 100 pixels for space at the bottom

let modal;
let closeButton;

let timeSignature = 4; // Default time signature (4/4)
let dropdown;

let tempoSlider;
let defaultBPM = 120; // Default tempo in beats per minute

function preload() {
  soundSamples[0] = loadSound('notes/note0.mp3', loaded, loadError);
  soundSamples[1] = loadSound('notes/note1.mp3', loaded, loadError);
  soundSamples[2] = loadSound('notes/note2.mp3', loaded, loadError);
  soundSamples[3] = loadSound('notes/note3.mp3', loaded, loadError);
  soundSamples[4] = loadSound('notes/note4.mp3', loaded, loadError);
  soundSamples[5] = loadSound('notes/note5.mp3', loaded, loadError);
  soundSamples[6] = loadSound('notes/note6.mp3', loaded, loadError);
  soundSamples[7] = loadSound('notes/note7.mp3', loaded, loadError);
  soundSamples[8] = loadSound('notes/note8.mp3', loaded, loadError);
  soundSamples[9] = loadSound('notes/note9.mp3', loaded, loadError);
  soundSamples[10] = loadSound('notes/note10.mp3', loaded, loadError);
  soundSamples[11] = loadSound('notes/note11.mp3', loaded, loadError);
}

function loaded() {
  console.log('Sound file loaded');
}

class Note {
  constructor(pitch, startTime, duration) {
    this.pitch = pitch;
    this.startTime = startTime;
    this.duration = duration;
  }

  display() {
    let x = this.startTime * timeUnit; // Do not add gridX/Y here; it's adjusted during drawing
    let y = this.pitch * pitchUnit;
    let w = this.duration * timeUnit;
    let h = pitchUnit;

    push(); // Isolate state
    translate(gridX, gridY); // Move to grid start
    fill(0); // Black color for the notes
    rect(x, y, w, h);
    pop(); // Restore state
  }

  isMouseOver(x, y) {
    let noteX = this.startTime * timeUnit;
    let noteY = this.pitch * pitchUnit;
    let noteW = this.duration * timeUnit;
    let noteH = pitchUnit;
    return x >= noteX && x <= noteX + noteW && y >= noteY && y <= noteY + noteH;
  }
}

function loadError() {
  console.error('Error loading sound file');
}

function saveState() {
  let data = {
    notes: notes,
    tempo: tempoSlider.value(),
    timeSignature: timeSignature
  };

  saveJSON(data, 'sequencerState.json');
}

function loadState(file) {
  console.log("File type:", file.type); // Debugging

  // Check for JSON file type or .json extension
  if (file.type === 'application/json' || file.name.endsWith('.json')) {
    let reader = new FileReader();
    reader.onload = function(event) {
      let data;
      try {
        data = JSON.parse(event.target.result);
      } catch (e) {
        console.error("Error parsing JSON:", e);
        return;
      }

      // Clear existing notes
      notes = [];

      // Reconstruct notes
      for (let noteData of data.notes) {
        let note = new Note(noteData.pitch, noteData.startTime, noteData.duration);
        notes.push(note);
      }

      // Set tempo and time signature
      tempoSlider.value(data.tempo);
      setTimeSignature(data.timeSignature);
      updateTempoDisplay();
    };
    reader.readAsText(file.file);
  } else {
    console.error('Not a JSON file');
  }
}

function setTimeSignature(value) {
  timeSignature = value;
  dropdown.value(value + '/4');
  updateTimeSignature();
}

function setup() {
  createCanvas(totalCanvasWidth, totalCanvasHeight);
  numberOfPitches = 12; // number of pitches
  pitchUnit = gridHeight / numberOfPitches;
  timeUnit = 40; // Adjust for your desired horizontal spacing
  playButton = createButton('Play');
  playButton.position(10, gridY + gridHeight + 10);
  playButton.mousePressed(togglePlayback);
  
  helpButton = createButton('?');
  helpButton.position(530, gridY + gridHeight + 10);
  helpButton.mousePressed(showModal);  
  
  // Save button
  saveButton = createButton('Save');
  saveButton.position(410, gridY + gridHeight + 10);
  saveButton.mousePressed(saveState);

  // Load button
  loadButton = createButton('Load');
  loadButton.position(465, gridY + gridHeight + 10);
  loadButton.mousePressed(() => document.getElementById('file-input').click());  
  
  
  tempoSlider = createSlider(30, 240, defaultBPM); // min, max, default value
  tempoSlider.position(80, gridY + gridHeight + 10); // Position it below the canvas
  
  // Create a tempo display button
  tempoDisplay = createButton(`Tempo: ${tempoSlider.value()} BPM`);
  tempoDisplay.position(tempoSlider.x + tempoSlider.width + 5, tempoSlider.y +2);
  tempoDisplay.mousePressed(function() {
    // This function intentionally does nothing on press.
  });
  tempoDisplay.style('width', '120px'); // Adjust width as needed
  tempoDisplay.style('height', '20px'); // Adjust height as needed  
  tempoDisplay.style('background-color', 'transparent'); // Optional: make background transparent
  tempoDisplay.style('border', 'none'); // Optional: remove border
  tempoDisplay.style('color', 'black'); // Adjust text color as needed
  tempoDisplay.style('pointer-events', 'none'); // Make the button ignore mouse events
  tempoDisplay.style('font-size', '12px'); // Adjust font size as needed  
  
  dropdown = createSelect();
  dropdown.position(330, 461);
  dropdown.option('None', ''); // Blank option  
  dropdown.option('2/4');
  dropdown.option('3/4');
  dropdown.option('4/4', '4');
  dropdown.option('5/4');
  dropdown.value('4/4');
  updateTimeSignature(); // Manually call to set default time signature  
  dropdown.changed(updateTimeSignature);  
  
  // Select the modal and close button
  modal = select('#myModal');
  closeButton = select('.close');

  // Attach event handlers if elements are correctly selected
  if (modal) {
    modal.mousePressed(function(event) {
      event.stopPropagation();
    });
  } else {
    console.error("Modal not found");
  }

  if (closeButton) {
    closeButton.mousePressed(function(event) {
      hideModal(event);
    });
  } else {
    console.error("Close button not found");
  }

  // Hidden file input
  let fileInput = createFileInput(loadState);
  fileInput.id('file-input');
  fileInput.style('display', 'none');    
  
  console.log('Loaded sound samples:', soundSamples);
}

function showModal() {
  modal.style('display', 'block');
  isModalOpen = true; // Set the flag when the modal is shown
}

function hideModal(event) {
  if (event) {
    event.stopPropagation();
  }
  modal.style('display', 'none');
  isModalOpen = false; // Reset the flag when the modal is hidden
}

function updateTimeSignature() {
  let selection = dropdown.value();
  if (selection === '') {
    timeSignature = null; // Set to null for 'None' option
  } else {
    timeSignature = parseInt(selection.split('/')[0]);
  }
}

function togglePlayback() {
  if (isPlaying) {
    // Stop the playback
    stopPlayback();
    playButton.html('Play'); // Change button label to "Play"
  } else {
    // Start the playback
    playNotes();
    playButton.html('Stop'); // Change button label to "Stop"
  }
}

function getSquareDuration() {
  let currentBPM = tempoSlider.value();
  // At 60 BPM, one square is 0.25 seconds. Find the square duration for the current BPM
  return (60 / currentBPM) * 250; // 250 ms is the duration at 60 BPM
}

function playNotes() {
  isPlaying = true;
  playButton.html('Stop'); // Change button label to "Stop"
  timeoutIDs = []; // Reset the timeout IDs array

  for (let note of notes) {
    let squareDuration = getSquareDuration();
    let playTime = note.startTime * squareDuration;
    let stopTime = playTime + note.duration * squareDuration;
    let invertedPitch = numberOfPitches - 1 - note.pitch;

    let sound = soundSamples[invertedPitch];
    if (sound) {
      let playTimeoutID = setTimeout(() => {
        sound.play();
      }, playTime);
      timeoutIDs.push(playTimeoutID);

      let stopTimeoutID = setTimeout(() => {
        sound.setVolume(0, 0.07, stopTime); // fade out 70ms
        setTimeout(() => {
          sound.stop();
          sound.setVolume(1);
        }, 70); // fade out 70ms
      }, stopTime);
      timeoutIDs.push(stopTimeoutID);
    }
  }

  // Set a timeout to reset the isPlaying flag and button label
  let resetTimeoutID = setTimeout(() => {
    isPlaying = false;
    playButton.html('Play');
  }, Math.max(...notes.map(note => note.startTime + note.duration)) * getSquareDuration());
  timeoutIDs.push(resetTimeoutID);
}

function stopPlayback() {
  if (isPlaying) {
    // Clear all scheduled timeouts
    timeoutIDs.forEach(timeoutID => clearTimeout(timeoutID));
    timeoutIDs = [];

    // Immediately stop all sounds
    for (let soundSample of soundSamples) {
      if (soundSample.isPlaying()) {
        soundSample.stop();
      }
    }

    // Reset the playback state
    isPlaying = false;
    playButton.html('Play');
  }
}

function updateTempoDisplay() {
  tempoDisplay.html(`Tempo: ${tempoSlider.value()} BPM`);
}

function draw() {
  background(245, 222, 179); // Off-white brown color for the canvas
  drawGrid();
  drawNoteNames(); // Draw the note names
  for (let note of notes) {
    note.display();
  }
  if (creatingNote && tempNote) {
    tempNote.display();
  }
  tempoSlider.input(updateTempoDisplay); // Use the new function here
  playButton.position(10 + window.scrollX, playButton.position().y);
  tempoSlider.position(60 + window.scrollX, playButton.position().y);
  tempoDisplay.position(200 + window.scrollX, tempoDisplay.position().y);
  dropdown.position(330 + window.scrollX, dropdown.position().y);
  
  saveButton.position(410 + window.scrollX, saveButton.position().y);
  loadButton.position(465 + window.scrollX, loadButton.position().y);
  helpButton.position(525 + window.scrollX, helpButton.position().y);

}

function drawNoteNames() {
  // Reversed order so it matches the grid layout from bottom to top
  let noteNames = ['B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4'];
  let xOffset = window.scrollX; // Get the current horizontal scroll position
  let boxWidth = 40; // Width of the box for each note
  let boxHeight = pitchUnit; // Height of the box, same as pitchUnit for consistency
  textSize(12); // Set the text size
  textAlign(LEFT, CENTER); // Align text to be left-aligned and vertically centered

  for (let i = 0; i < noteNames.length; i++) {
    let noteName = noteNames[i]; // Access note names directly in the corrected order
    let isSharpNote = noteName.includes('#');

    // Determine the fill color based on whether the note is a sharp note
    fill(isSharpNote ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)');

    // Calculate the vertical position for the box
    let y = gridY + i * pitchUnit;
    // Draw the box
    rect(gridX - boxWidth - 10 + xOffset, y, boxWidth, boxHeight);

    // Set the text color to contrast the box color
    fill(isSharpNote ? 255 : 0); // White text for black boxes, black text for white boxes
    // Draw the note name, positioned within the box
    text(noteName, gridX - boxWidth - 5 + xOffset, y + boxHeight / 2);
  }
}

function drawGrid() {
  push(); // Isolate drawing state
  translate(gridX, gridY); // Shift origin to grid's top-left corner

  // Draw vertical lines within grid
  for (let x = 0; x <= gridWidth; x += timeUnit) {
    let lineWeight = 1;
    if (timeSignature && (x / timeUnit) % (4 * timeSignature) === 0) lineWeight = 5;
    else if ((x / timeUnit) % 4 === 0) lineWeight = 2;

    strokeWeight(lineWeight);
    stroke(180); // Grey color for the grid lines
    line(x, 0, x, gridHeight);
  }

  // Draw horizontal lines
  for (let y = 0; y <= gridHeight; y += pitchUnit) {
    strokeWeight(1);
    stroke(180); // Grey color for grid lines
    line(0, y, gridWidth, y);
  }

  pop(); // Restore original drawing state
}

function mousePressed() {
  if (isModalOpen || mouseX < gridX || mouseX > gridX + gridWidth || mouseY < gridY || mouseY > gridY + gridHeight) {
    return; // Early exit if outside grid bounds or modal open
  }
  let adjustedMouseX = mouseX - gridX;
  let adjustedMouseY = mouseY - gridY;
  
  // Check if the click is within the canvas bounds
  if (adjustedMouseX > 0 && adjustedMouseX < gridWidth && adjustedMouseY > 0 && adjustedMouseY < gridHeight) {
    let foundNote = false;

    // Check if a note is clicked and delete it
    for (let i = notes.length - 1; i >= 0; i--) {
      if (notes[i].isMouseOver(adjustedMouseX, adjustedMouseY)) {
        notes.splice(i, 1);
        foundNote = true;
        break;
      }
    }

    // If no note was clicked, create a new note
    if (!foundNote) {
      let pitch = floor(adjustedMouseY / pitchUnit);
      let startTime = floor(adjustedMouseX / timeUnit);
      tempNote = new Note(pitch, startTime, 1); // Default duration is 1
      creatingNote = true;
    }
  }
}

function mouseDragged() {
  if (creatingNote && tempNote) {
    let adjustedMouseX = mouseX - gridX;
    let adjustedMouseY = mouseY - gridY;
    let newDuration = floor((adjustedMouseX - tempNote.startTime * timeUnit) / timeUnit);
    tempNote.duration = max(1, newDuration);
  }
}

function mouseReleased() {
  if (creatingNote && tempNote) {
    notes.push(tempNote);
    creatingNote = false;
    tempNote = null;
  }
}

