import { Divider,   DialogActions,
  Fade, Typography, Box,
  Button,
  DialogContent,
  TextField,
  makeStyles, } from "@material-ui/core";
import React, { FunctionComponent, useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ActionButton,
  ActionButtonWrapper,
} from "../../../components/buttons/Buttons";
import {
  AssetDropdown,
  AssetDropdownWrapper,
} from "../../../components/dropdowns/AssetDropdown";
import { NumberFormatText } from "../../../components/formatting/NumberFormatText";
import {
  OutlinedTextField,
  BigOutlinedTextFieldWrapper,SmallOutlinedTextFieldWrapper
} from "../../../components/inputs/OutlinedTextField";
import {
  BigCurrencyInput,
  BigCurrencyInputWrapper,
} from "../../../components/inputs/BigCurrencyInput";
import { PaperContent } from "../../../components/layout/Paper";
import { Link } from "../../../components/links/Links";
import { CenteredProgress } from "../../../components/progress/ProgressHelpers";
import { TooltipWithIcon } from "../../../components/tooltips/TooltipWithIcon";
import {
  AssetInfo,
  LabelWithValue,
} from "../../../components/typography/TypographyHelpers";
import { releaseChainClassMap } from "../../../services/rentx";
import {
  getChainConfig,
  getCurrencyConfig,
  supportedBurnChains,
  supportedReleaseCurrencies,
  toReleasedCurrency,
} from "../../../utils/assetConfigs";
import { useFetchFees } from "../../fees/feesHooks";
import { getTransactionFees } from "../../fees/feesUtils";
import { $renNetwork } from "../../network/networkSlice";
import { useRenNetworkTracker } from "../../transactions/transactionsHooks";
import {
  isMinimalAmount,
  TxConfigurationStepProps,
  TxType,
} from "../../transactions/transactionsUtils";
import { useSelectedChainWallet } from "../../wallet/walletHooks";
import {
  $wallet,
  setChain,
  setWalletPickerOpened,
} from "../../wallet/walletSlice";
import { getAssetBalance, useFetchBalances } from "../../wallet/walletUtils";
import {
  $release,
  setReleaseAddress,
  setReleaseCurrency,
  setReleaseAmount,
} from "../releaseSlice";
import validate, { Network } from "../releaseAddressValidator";
import { BridgeModal } from "../../../components/modals/BridgeModal";
import { Alert } from "@material-ui/lab";
import { getLogs } from "../../../services/bridge";

export const ReleaseInitialStep: FunctionComponent<TxConfigurationStepProps> = ({
  onNext,
}) => {
  const dispatch = useDispatch();
  const { walletConnected } = useSelectedChainWallet();
  const { chain, balances } = useSelector($wallet);
  const network = useSelector($renNetwork);
  const { currency, address, amount } = useSelector($release);
  const balance = getAssetBalance(balances, currency);
  const [recoverProcessing, setRecoverProcessing] = useState(false);

  useRenNetworkTracker(currency);
  useFetchBalances(supportedReleaseCurrencies);
  const { fees, pending } = useFetchFees(currency, TxType.BURN);
 

  const handleChainChange = useCallback(
    (event) => {
      dispatch(setChain(event.target.value));
    },
    [dispatch]
  );
  const handleCurrencyChange = useCallback(
    (event) => {
      dispatch(setReleaseCurrency(event.target.value));
    },
    [dispatch]
  );
 
  const handleAddressChange = useCallback(
    (event) => {
      dispatch(setReleaseAddress(event.target.value));
    },
    [dispatch]
  );
  
  const handleAmountChange = useCallback(
    (event) => {
      dispatch(setReleaseAmount(event.target.value));
    },
    [dispatch]
  );

  const [recoverOpened, setRecoverOpened] = useState(false);
  const handleRecover = useCallback((e) => {
    setRecoverOpened(true);
    setRecoverError("");
    setRecoverGood("");
    setRecoverProcessing(false);
    e.preventDefault();
  }, []);
  const handleRecoverClose = useCallback(() => {
    setRecoverOpened(false);
  }, []);
 

  

  const targetCurrency = toReleasedCurrency(currency);
  const currencyConfig = getCurrencyConfig(currency);
  const releaseCurrencyConfig = getCurrencyConfig(targetCurrency);
  const { MainIcon } = releaseCurrencyConfig;
  const releaseChainConfig = getChainConfig(releaseCurrencyConfig.sourceChain);
  const [recoverError, setRecoverError] = useState("");
  const [recoverGood, setRecoverGood] = useState("");
  const [recoverTxId, setRecoverTxId] = useState("");

  const validateAddress = useMemo(() => {
    // TODO: improve this
    return validate(address, Network.mainnet)

 }, [releaseChainConfig.rentxName, network, address]);
  
  const basicCondition =
    address &&
    validateAddress &&
    !pending;
  const hasBalance = balance !== null;
  let enabled;
  if (walletConnected) {
    enabled = basicCondition && amount>0.1; // TODO: also check balance here
  } else {
    enabled = basicCondition && amount>0.1;
  }
  const showMinimalAmountError =
    walletConnected && !pending;

  const handleRecoverNext = useCallback(() => {
    setRecoverError("") 
    setRecoverGood("")
      setRecoverProcessing(true);
      try {
        getLogs(recoverTxId, chain=="BSCC"?"binance":"ethereum").then((jsonObj) => {
          if(jsonObj.status == 2) {
            setRecoverError(jsonObj.blame?.fail_reason || "unknown error")
            setRecoverProcessing(false);
          }else{
            console.log(jsonObj)
            setRecoverGood("Broadcasted raw tx: " + jsonObj.DefiTx)
            setRecoverProcessing(false);
          }
        }).catch((e) => {
          setRecoverError(e.toString())
          setRecoverProcessing(false);
        })
      }
      catch(e) {
        setRecoverError(e.toString())
        setRecoverProcessing(false);
      }

  }, [recoverTxId, chain])

  const handleNextStep = useCallback(() => {
    if (!walletConnected) {
      dispatch(setWalletPickerOpened(true));
    }
    if (onNext && basicCondition && hasBalance) {
      onNext();
    }
  }, [dispatch, onNext, walletConnected, basicCondition, hasBalance]);


  const useStyles = makeStyles((theme) => ({
    root: {
      "& .MuiInputBase-input": {
        background: "rgb(232, 241, 250)"
      },
      "& .MuiAlert-message": { 
        overflowWrap: "anywhere"
     }
    }
  }));
  const classes = useStyles()
  return (
    <>
      <PaperContent>
        <AssetDropdownWrapper>
          <AssetDropdown
            label="Chain"
            mode="chain"
            available={supportedBurnChains}
            value={chain}
            onChange={handleChainChange}
          />
        </AssetDropdownWrapper>
        <AssetDropdownWrapper>
          <AssetDropdown
            label="Asset"
            mode="send"
            available={supportedReleaseCurrencies}
            balances={balances}
            value={currency}
            onChange={handleCurrencyChange}
          />
        </AssetDropdownWrapper>
       
        <BigOutlinedTextFieldWrapper>
          <OutlinedTextField
            error={!!address && !validateAddress}
            placeholder={`Enter a Destination ${releaseChainConfig.full} Address`}
            label="Releasing to"
            onChange={handleAddressChange}
            value={address}
          />
        </BigOutlinedTextFieldWrapper>
        <SmallOutlinedTextFieldWrapper>
          <OutlinedTextField
            error={!!address && !validateAddress}
            placeholder={`Enter an Amount`}
            label="Amount to Burn/Transfer"
            onChange={handleAmountChange}
            

          />
        </SmallOutlinedTextFieldWrapper>
      </PaperContent>
      <Divider />
      <PaperContent darker topPadding bottomPadding>
        <ActionButtonWrapper>
          <ActionButton
            onClick={handleNextStep}
            disabled={walletConnected ? !enabled : false}
          >
            {walletConnected ? "Next" : "Connect Wallet"}
          </ActionButton>
        </ActionButtonWrapper>
        <Typography
          variant="subtitle2"
          align="center"
          color="textSecondary"
          gutterBottom
        >
        {walletConnected ? <Link href={'#'} onClick={handleRecover} color='textSecondary'>
            Click here to recover an incomplete transaction
        </Link> : ""}
        </Typography>
      </PaperContent>
      <BridgeModal
        open={recoverOpened}
        title="Recovery"
        onClose={handleRecoverClose}
      >
      <DialogContent>
          {recoverError!="" ? <Box mb={2}><Alert severity="error">{recoverError}</Alert></Box> : ""}
          {recoverGood!="" ? <Box mb={2}><Alert className={classes.root} severity="success">{recoverGood}</Alert></Box> : ""}
          <Typography variant="h5" align="center" gutterBottom>
            Transaction Recovery
          </Typography>
          <Typography variant="body2" align="center" gutterBottom>
            If you haven't received your native DFI after burning them on {chain.toString()=="BSCC" ? "Binance" : "Ethereum"}, you can use this recovery form to re-request them. Let's start with the transaction id of your burn transaction.
          </Typography>
          <Box mt={3} alignItems="center" justifyContent="center" display="flex" >
          <TextField autoFocus className={classes.root} style ={{width: '60%'}} 
            label={chain.toString()=="BSCC" ? "Enter your Binance TxID" : "Enter your Ethereum TxID"}
            onChange={(e) => {
              setRecoverTxId(e.target.value);
            }}
          />
          </Box>
          <Box mt={5} alignItems="center" justifyContent="center" display="flex" >
             <ActionButton disabled={recoverProcessing} onClick={handleRecoverNext}>{!recoverProcessing ? "Recover" : "Wait ... might take some time."}</ActionButton>
          </Box>
      </DialogContent>
      </BridgeModal>
    </>
  );
};
