import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

import { version } from "../package.json";

const info = <const>{
  name: "html-keynbutton-response",
  version: version,
  parameters: {
    /**
     * The string to be displayed.
     */
    stimulus: {
      type: ParameterType.HTML_STRING,
      default: undefined,
    },
    /**
     * This array contains the key(s) that the participant is allowed to press in order to respond
     * to the stimulus. Keys should be specified as characters (e.g., `'a'`, `'q'`, `' '`, `'Enter'`, `'ArrowDown'`) - see
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values this page}
     * and
     * {@link https://www.freecodecamp.org/news/javascript-keycode-list-keypress-event-key-codes/ this page (event.key column)}
     * for more examples. Any key presses that are not listed in the
     * array will be ignored. The default value of `"ALL_KEYS"` means that all keys will be accepted as valid responses.
     * Specifying `"NO_KEYS"` will mean that no responses are allowed.
     */
    choices: {
      type: ParameterType.KEYS,
      default: "ALL_KEYS",
    },
    show_button: {
      type: ParameterType.BOOL,
      default: true,
    },
    button_html: {
      type: ParameterType.FUNCTION,
      default: function (choice: string, choice_index: number) {
        return `<button class="jspsych-btn">${choice}</button>`;
      },
    },
    button_layout: {
      type: ParameterType.STRING,
      default: "grid",
    },
    grid_rows: {
      type: ParameterType.INT,
      default: 1,
    },
    grid_columns: {
      type: ParameterType.INT,
      default: null,
    },
    enable_button_after: {
      type: ParameterType.INT,
      default: 0,
    },
    /**
     * This string can contain HTML markup. Any content here will be displayed below the stimulus.
     * The intention is that it can be used to provide a reminder about the action the participant
     * is supposed to take (e.g., which key to press).
     */
    prompt: {
      type: ParameterType.HTML_STRING,
      default: null,
    },
    /**
     * How long to display the stimulus in milliseconds. The visibility CSS property of the stimulus
     * will be set to `hidden` after this time has elapsed. If this is null, then the stimulus will
     * remain visible until the trial ends.
     */
    stimulus_duration: {
      type: ParameterType.INT,
      default: null,
    },
    /**
     * How long to wait for the participant to make a response before ending the trial in milliseconds.
     * If the participant fails to make a response before this timer is reached, the participant's response
     * will be recorded as null for the trial and the trial will end. If the value of this parameter is null,
     * then the trial will wait for a response indefinitely.
     */
    trial_duration: {
      type: ParameterType.INT,
      default: null,
    },
    /**
     * If true, then the trial will end whenever the participant makes a response (assuming they make their
     * response before the cutoff specified by the trial_duration parameter). If false, then the trial will
     * continue until the value for trial_duration is reached. You can set this parameter to false to force
     * the participant to view a stimulus for a fixed amount of time, even if they respond before the time is complete.
     */
    response_ends_trial: {
      type: ParameterType.BOOL,
      default: true,
    },
  },
  data: {
    /** Indicates which key the participant pressed. */
    response: {
      type: ParameterType.STRING,
    },
    /** The response time in milliseconds for the participant to make a response. The time is measured from when the stimulus first appears on the screen until the participant's response. */
    rt: {
      type: ParameterType.INT,
    },
    /** The HTML content that was displayed on the screen. */
    stimulus: {
      type: ParameterType.STRING,
    },
  },
};

type Info = typeof info;

/**
 * This plugin displays HTML content and records responses generated with the keyboard.
 * The stimulus can be displayed until a response is given, or for a pre-determined amount of time.
 * The trial can be ended automatically if the participant has failed to respond within a fixed length of time.
 *
 * @author Josh de Leeuw
 * @see {@link https://www.jspsych.org/latest/plugins/html-keynbutton-response/ html-keynbutton-response plugin documentation on jspsych.org}
 */
class HtmlKeyAndButtonPlugin implements JsPsychPlugin<Info> {
  static info = info;
  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    // Display stimulus
    const stimulusElement = document.createElement("div");
    stimulusElement.id = "jspsych-html-keynbutton-response-stimulus";
    stimulusElement.innerHTML = trial.stimulus;

    display_element.appendChild(stimulusElement);

    // Display buttons
    let buttonGroupElement = null
    if (trial.show_button && trial.choices !== null && trial.choices !== "ALL_KEYS" && trial.choices !== "NO_KEYS") {

      buttonGroupElement = document.createElement("div");
      buttonGroupElement.id = "jspsych-html-button-response-btngroup";
      if (trial.button_layout === "grid") {
        buttonGroupElement.classList.add("jspsych-btn-group-grid");
        if (trial.grid_rows === null && trial.grid_columns === null) {
          throw new Error(
            "You cannot set `grid_rows` to `null` without providing a value for `grid_columns`."
          );
        }
        const n_cols =
          trial.grid_columns === null
            ? Math.ceil(trial.choices.length / trial.grid_rows)
            : trial.grid_columns;
        const n_rows =
          trial.grid_rows === null
            ? Math.ceil(trial.choices.length / trial.grid_columns)
            : trial.grid_rows;
        buttonGroupElement.style.gridTemplateColumns = `repeat(${n_cols}, 1fr)`;
        buttonGroupElement.style.gridTemplateRows = `repeat(${n_rows}, 1fr)`;
      } else if (trial.button_layout === "flex") {
        buttonGroupElement.classList.add("jspsych-btn-group-flex");
      }

      for (const [choiceIndex, choice] of trial.choices.entries()) {
        buttonGroupElement.insertAdjacentHTML("beforeend", trial.button_html(choice, choiceIndex));
        const buttonElement = buttonGroupElement.lastChild as HTMLElement;
        buttonElement.dataset.choice = choiceIndex.toString();
        buttonElement.addEventListener("click", () => {
          after_response({key:choice,rt:null});
        });
      }

      display_element.appendChild(buttonGroupElement);
    }
    if (trial.enable_button_after > 0) {
      var btns = document.querySelectorAll(".jspsych-html-button-response-button button");
      for (var i = 0; i < btns.length; i++) {
        btns[i].setAttribute("disabled", "disabled");
      }
      this.jsPsych.pluginAPI.setTimeout(() => {
        var btns = document.querySelectorAll(".jspsych-html-button-response-button button");
        for (var i = 0; i < btns.length; i++) {
          btns[i].removeAttribute("disabled");
        }
      }, trial.enable_button_after);
    }

    // Show prompt if there is one
    if (trial.prompt !== null) {
      display_element.insertAdjacentHTML("beforeend", trial.prompt);
    }

    // start time
    var start_time = performance.now();
    // store response
    var response = {
      rt: null,
      key: null,
    };

    // function to end trial when it is time
    const end_trial = () => {
      // kill keyboard listeners
      if (typeof keyboardListener !== "undefined") {
        this.jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
      }

      // gather the data to store for the trial
      var trial_data = {
        rt: response.rt,
        stimulus: trial.stimulus,
        response: response.key,
      };

      // move on to the next trial
      this.jsPsych.finishTrial(trial_data);
    };

    // function to handle responses by the subject
    var after_response = (info) => {
      // after a valid response, the stimulus will have the CSS class 'responded'
      // which can be used to provide visual feedback that a response was recorded
      stimulusElement.classList.add("responded");
      
      // only record the first response
      if (response.key == null) {
        response = info;
      }
      // NOTE: there maybe a 1ms delay between the keyboardListener and the performance. 
      // console.log('info or choiceindex',response)
      let end_time = performance.now();
      response.rt = Math.round(end_time - start_time);
      // console.log('info or choiceindex',response)

      // disable all the buttons after a response
      if (trial.show_button && buttonGroupElement !== null){
        for (const button of buttonGroupElement.children) {
          button.setAttribute("disabled", "disabled");
        }
      }

      if (trial.response_ends_trial) {
        end_trial();
      }
    };

    // start the response listener
    if (trial.choices != "NO_KEYS") {
      var keyboardListener = this.jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: trial.choices,
        rt_method: "performance",
        persist: false,
        allow_held_key: false,
      });
    }

    // hide stimulus if stimulus_duration is set
    if (trial.stimulus_duration !== null) {
      this.jsPsych.pluginAPI.setTimeout(() => {
        display_element.querySelector<HTMLElement>(
          "#jspsych-html-keynbutton-response-stimulus"
        ).style.visibility = "hidden";
      }, trial.stimulus_duration);
    }

    // end trial if trial_duration is set
    if (trial.trial_duration !== null) {
      this.jsPsych.pluginAPI.setTimeout(end_trial, trial.trial_duration);
    }
  }

  simulate(
    trial: TrialType<Info>,
    simulation_mode,
    simulation_options: any,
    load_callback: () => void
  ) {
    if (simulation_mode == "data-only") {
      load_callback();
      this.simulate_data_only(trial, simulation_options);
    }
    if (simulation_mode == "visual") {
      this.simulate_visual(trial, simulation_options, load_callback);
    }
  }

  private create_simulation_data(trial: TrialType<Info>, simulation_options) {
    const default_data = {
      stimulus: trial.stimulus,
      rt: this.jsPsych.randomization.sampleExGaussian(500, 50, 1 / 150, true),
      response: this.jsPsych.pluginAPI.getValidKey(trial.choices),
    };

    const data = this.jsPsych.pluginAPI.mergeSimulationData(default_data, simulation_options);

    this.jsPsych.pluginAPI.ensureSimulationDataConsistency(trial, data);

    return data;
  }

  private simulate_data_only(trial: TrialType<Info>, simulation_options) {
    const data = this.create_simulation_data(trial, simulation_options);

    this.jsPsych.finishTrial(data);
  }

  private simulate_visual(trial: TrialType<Info>, simulation_options, load_callback: () => void) {
    const data = this.create_simulation_data(trial, simulation_options);

    const display_element = this.jsPsych.getDisplayElement();

    this.trial(display_element, trial);
    load_callback();

    if (data.rt !== null) {
      this.jsPsych.pluginAPI.pressKey(data.response, data.rt);
    }
  }
}

export default HtmlKeyAndButtonPlugin;
