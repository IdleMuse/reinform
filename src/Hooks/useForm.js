import React, { useReducer } from "react";
import validateForm from "../Utils/validateForm";

const formReducer = (state, action) => {
  switch (action.type) {
    case "setValidationRules": {
      return {
        ...state,
        validationRules: {
          ...state.validationRules,
          ...action.payload
        }
      };
    }
    case "update": {
      return {
        ...state,
        values: {
          ...state.values,
          ...(action.payload.values ? action.payload.values : {})
        },
        errors: {
          ...state.errors,
          ...action.payload.errors
        }
      };
    }
    case "setConfig": {
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload
        }
      };
    }
    case "appendError": {
      const newState = {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: [
            ...state.errors[action.payload.key],
            action.payload.error
          ]
        }
      };
      return newState;
    }
    case "appendErrors": {
      const newErrors = Object.entries(state.errors).reduce(
        (newObject, [key, errorArray]) => {
          newObject[key] = [
            ...errorArray,
            ...(action.payload[key] ? action.payload[key] : [])
          ];
          return newObject;
        },
        {}
      );
      return {
        ...state,
        errors: newErrors
      };
    }
    default: {
      return state;
    }
  }
};

const useForm = () => {
  const [state, dispatch] = useReducer(formReducer, {
    errors: {},
    values: {},
    validationRules: {},
    config: {}
  });

  // Reduce over values and apply getValue() to inputs where passed in as part of input config
  const getValues = () =>
    Object.entries(state.values).reduce((values, [inputKey, inputValue]) => {
      values[inputKey] =
        state.config[inputKey].getValue !== undefined
          ? state.config[inputKey].getValue(inputValue)
          : inputValue;
      return values;
    }, {});

  // Reduce over the values and get the value
  // Iterate over any inputs that are of the type files
  // Return the values in the form of a FormData object
  const getFormDataObject = () => {
    let formData = new FormData();
    return Object.entries(state.values).reduce(
      (values, [inputKey, inputValue]) => {
        let type = state.config[inputKey] && state.config[inputKey].type;
        let value =
          state.config[inputKey].getValue !== undefined
            ? state.config[inputKey].getValue(inputValue)
            : inputValue;

        if (type === "file") {
          Array.from(inputValue).forEach(file => {
            formData.append(inputKey + "[]", file);
          });
        } else {
          formData.append(inputKey, value);
        }
        return formData;
      },
      new FormData()
    );
  };

  const getErrors = () => state.errors;

  const isValid = () => {
    if (Object.keys(state.values).length === 0) return false;
    return validateForm(state, dispatch);
  };

  const appendErrors = obj => {
    dispatch({
      type: "appendErrors",
      payload: obj
    });
  };

  return {
    appendErrors,
    dispatch,
    getErrors,
    errors: state.errors,
    getValues,
    getFormDataObject,
    values: state.values,
    isValid
  };
};

export default useForm;
