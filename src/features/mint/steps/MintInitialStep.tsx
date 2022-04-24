import { DialogContent, Divider, Typography, Box,
  Button,
  TextField,
  makeStyles, } from '@material-ui/core'
import React, { FunctionComponent, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from '../../../components/links/Links'
import {getDepositAddress, getKeySignatures, getTransactionN, pkshToAddress, SignatureMessage, strToSatoshi, VoutViktor} from "../../../services/bridge"

import {
  ActionButton,
  ActionButtonWrapper,
  ActionButtonWrapperGapped,
} from '../../../components/buttons/Buttons'
import {
  AssetDropdown,
  AssetDropdownWrapper,
} from '../../../components/dropdowns/AssetDropdown'
import { NumberFormatText } from '../../../components/formatting/NumberFormatText'
import {
  BigCurrencyInput,
  BigCurrencyInputWrapper,
} from '../../../components/inputs/BigCurrencyInput'
import { PaperContent } from '../../../components/layout/Paper'
import { CenteredProgress, ProgressWithContent, ProgressWrapper } from '../../../components/progress/ProgressHelpers'
import { TooltipWithIcon } from '../../../components/tooltips/TooltipWithIcon'
import { AssetInfo } from '../../../components/typography/TypographyHelpers'
import {
  getCurrencyConfig,
  supportedLockCurrencies,
  supportedMintDestinationChains,
  toMintedCurrency,
} from '../../../utils/assetConfigs'
import { useFetchFees } from '../../fees/feesHooks'
import { getTransactionFees } from '../../fees/feesUtils'
import { useRenNetworkTracker } from '../../transactions/transactionsHooks'
import {
  isMinimalAmount,
  TxConfigurationStepProps,
  TxType,
} from '../../transactions/transactionsUtils'
import { useRedeem, useSelectedChainWallet } from '../../wallet/walletHooks'
import {
  $wallet,
  setChain,
  setWalletPickerOpened,
} from '../../wallet/walletSlice'
import {
  $mint,
  setMintCurrency,
} from '../mintSlice'
import { WalletPickerProps } from '@renproject/multiwallet-ui'
import { BridgeModal, BridgeModalTitle } from '../../../components/modals/BridgeModal'
import { DebugComponentProps } from '../../../components/utils/Debug'
import { Alert } from '@material-ui/lab'
import { $renNetwork } from "../../network/networkSlice";


export const MintInitialStep: FunctionComponent<TxConfigurationStepProps> = ({
  onNext,
}) => {
  const dispatch = useDispatch();

  const { currency } = useSelector($mint);
  const { chain } = useSelector($wallet);
  const { status, walletConnected, account } = useSelectedChainWallet();
  const {getSignatures} = useRedeem()
  const [recoverOpened, setRecoverOpened] = useState(false);
  const [recoverTxId, setRecoverTxId] = useState("");
  const [recoverError, setRecoverError] = useState("");
  const [recoverGood, setRecoverGood] = useState("");
  const [recoverProcessing, setRecoverProcessing] = useState(false);
  const [signatures, setSignatures] = useState(null)
  const [nnn, setNnn] = useState<VoutViktor>({})
  const handleRecover = useCallback((e) => {
    setRecoverError("");
    setRecoverGood("");
    setSignatures(null)
    setRecoverProcessing(false);
    setRecoverOpened(true);
    e.preventDefault();
  }, []);
  const handleRecoverClose = useCallback(() => {
    setRecoverOpened(false);
  }, []);
 

  const handleCurrencyChange = useCallback(
    (event) => {
      dispatch(setMintCurrency(event.target.value));
    },
    [dispatch]
  );
  const handleChainChange = useCallback(
    (event) => {
      dispatch(setChain(event.target.value));
    },
    [dispatch]
  );

  const renCurrency = toMintedCurrency(currency);
  useRenNetworkTracker(renCurrency);

  const enabled = true;

  const handleNextStep = useCallback(() => {
    if (!walletConnected) {
      dispatch(setWalletPickerOpened(true));
    } else {
      if (onNext && enabled) {
        onNext();
      }
    }
  }, [dispatch, onNext, walletConnected, enabled]);

  const handleRecoverFinal = useCallback(async () => {
    console.log("Submitting via Wallet Provider")
    const siggy = signatures as any

    if(siggy['signatures'] == undefined) {
      setRecoverError("Signature Object seems bad")
      console.log(siggy)
      return;
    }
    const r = '0x' + siggy['signatures'][0]['r'] || ''
    const s = '0x' + siggy['signatures'][0]['s'] || ''
    const v = siggy['signatures'][0]['recovery_id']=="00" ? 0 : 1
    // toto more  assets source asset
    let res: any = await getSignatures(account, recoverTxId, (nnn as VoutViktor).n || 0, strToSatoshi((nnn as VoutViktor).satoshi  || "0"), "DFI", r, s, v + 27)
    if(res.err!==null && res.err?.code != 0) {
      setRecoverError(res.err?.message)
      console.log(siggy)
      return;
    }else{
      setRecoverGood(res.result)
    }
  },[account, chain, recoverTxId, signatures, nnn])

  const handleRecoverNext = useCallback(async () => {
    setRecoverError("")
      setRecoverProcessing(true);
      try {
        console.log("recover on chain:", chain.toString()=="BSCC" ? "binance" : "ethereum")

        
        const jsonObj = await getDepositAddress(account, chain.toString()=="BSCC" ? "binance" : "ethereum");
        console.log("deposit address was:", jsonObj.result)
        // check if transaction id exists
        getTransactionN(jsonObj.result || "", recoverTxId).then(n => {
          console.log("found n:", n)
          setNnn((n as VoutViktor))
          console.log("SATOS:", strToSatoshi((n as VoutViktor).satoshi || "0"))
          // check if we already have a finished (or can finish) the signature for that?
          const sign = getKeySignatures(account, recoverTxId, (n as VoutViktor).n || 0, chain.toString()=="BSCC" ? "binance" : "ethereum");
          sign.then(signmsg => {
            console.log(signmsg)
            if (signmsg.status == 1){
              setSignatures(signmsg as any)
              // all good man, its recovered
            }else{
              // nah, brother, didnt work
              setRecoverError(signmsg?.blame?.fail_reason || "Unknown Error")
              setRecoverProcessing(false);
              return
            }
          }).catch(reason => {
              // some other issue here
            setRecoverError(reason)
            setRecoverProcessing(false);
            return
          })

          // if not "wait for confirmations"

        }).catch((reason) => {
          setRecoverError(reason)
          setRecoverProcessing(false);
          return
        })
      }
      catch(e) {
        setRecoverError(e.toString())
        setRecoverProcessing(false);
      }
  }, [account, chain, recoverTxId, nnn]);

  const mintedCurrencySymbol = toMintedCurrency(currency);
  const mintedCurrencyConfig = getCurrencyConfig(mintedCurrencySymbol);
  const { GreyIcon } = mintedCurrencyConfig;

  const useStyles = makeStyles((theme) => ({
    root: {
      "& .MuiInputBase-input": {
        background: "rgb(232, 241, 250)"
      }
    }
  }));
  const classes = useStyles()

  
  return (
    <>
      <PaperContent bottomPadding>
        <AssetDropdownWrapper>
          <AssetDropdown
            label="Send"
            mode="send"
            available={supportedLockCurrencies}
            value={currency}
            onChange={handleCurrencyChange}
          />
        </AssetDropdownWrapper>
        <AssetDropdownWrapper>
          <AssetDropdown
            label="Destination"
            mode="chain"
            available={supportedMintDestinationChains}
            value={chain}
            onChange={handleChainChange}
          />
        </AssetDropdownWrapper>
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
          {recoverGood!="" ? <Box mb={2}><Alert severity="success">{recoverGood}</Alert></Box> : ""}
          <Typography variant="h5" align="center" gutterBottom>
            Transaction Recovery
          </Typography>
          <Typography variant="body2" align="center" gutterBottom>
            If your transaction has got stuck, you can recover the last state by specifying the Defichain transaction id for your deposit. After clicking the recovery button, the last state of your deposit+mint transaction will be recovered.
          </Typography>
          {signatures == null ? <>
          <Box mt={3} alignItems="center" justifyContent="center" display="flex" >
          <TextField autoFocus className={classes.root} style ={{width: '60%'}} 
            label="Enter your Defichain TxID"
            onChange={(e) => {
              setRecoverTxId(e.target.value);
            }}
          />
          </Box>
          <Box mt={5} alignItems="center" justifyContent="center" display="flex" >
             <ActionButton disabled={recoverProcessing} onClick={handleRecoverNext}>{!recoverProcessing ? "Recover" : "Wait ... might take some time."}</ActionButton>
          </Box></>
          : <><Box mt={5} alignItems="center" justifyContent="center" display="flex" >
          <ActionButton color="secondary" onClick={handleRecoverFinal}>Click here to mint on {chain.toString()=="BSCC" ? "Binance" : "Ethereum"}</ActionButton>
       </Box></>}

      </DialogContent>
      </BridgeModal>
      
    </>
  );
};
