import {
  OutlinedInputProps,
  styled,
  TextField,
  TextFieldProps,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React, { FunctionComponent } from "react";

export const useStyles = makeStyles((theme) => ({
  root: {
    fontSize: 13,
    // border: `1px solid ${theme.palette.primary.main}`,
    // borderRadius: 20,
    // padding: 18,
  },
  input: {
    paddingTop: 10,
    fontSize: 13,
  },
}));

export const OutlinedTextField: FunctionComponent<TextFieldProps> = (props) => {
  const { input, ...classes } = useStyles();
  return (
    <TextField
      classes={classes}
      variant="outlined"
      InputProps={
        { notched: false, classes: { root: input } } as OutlinedInputProps
      }
      fullWidth
      {...props}
    />
  );
};

export const OutlinedTextFieldWrapper = styled("div")({
  minHeight: 75,
});

export const BigOutlinedTextFieldWrapper = styled("div")({
  marginTop: 40,
  marginBottom: 10,
});

export const SmallOutlinedTextFieldWrapper = styled("div")({
  marginTop: 0,
  marginBottom: 25,
});
