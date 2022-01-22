import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';
import { ZipReader, BlobReader, TextWriter, BlobWriter } from '@zip.js/zip.js';
import * as XAdES from 'xadesjs';


function verify(file) {
  const zf = new ZipReader(new BlobReader(file));
  return zf.getEntries().then((entries) => {
    return entries.find(
      (entry) => entry.filename == "META-INF/edoc-signatures-S1.xml"
    ).getData(new TextWriter())
  }).then((signaturesXml) => {
    try {
      return XAdES.Parse(signaturesXml, "application/xml");
    } catch (e) {
      console.info("Failed to parse xml");
      throw e;
    }
  }).then((signedDocument) => {
    var xmlSignature = signedDocument.getElementsByTagNameNS("http://www.w3.org/2000/09/xmldsig#", "Signature");
    var signedXml = new XAdES.SignedXml(signedDocument);

    signedXml.LoadXml(xmlSignature[0]);
    console.log(signedXml);
    zf.getEntries().then((entries) => {
      return entries.find(
        (entry) => entry.filename == "IMG_20220116_135705.pdf"
      ).getData(new BlobWriter()).then(
        (blob) => blob.arrayBuffer()
      ).then((data) => {
        console.log(data);
        return signedXml.Verify({
          content: data
        })
      })
    })
  })
}

function sign(file) {
  const alg = {
    name: "RSASSA-PKCS1-v1_5",
    hash: "SHA-256",
    publicExponent: new Uint8Array([1, 0, 1]),
    modulusLength: 2048,
  };
  const dataRaw = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  const tsRaw = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);

  // Create XAdES-T signature
  const signedXml = new XAdES.SignedXml();
  const ts = new XAdES.xml.SignatureTimeStamp();
  const ets = new XAdES.xml.EncapsulatedTimeStamp();
  ets.Encoding = "ber";
  ets.Value = tsRaw;
  ts.EncapsulatedTimeStamp.Add(ets);
  signedXml.UnsignedProperties.UnsignedSignatureProperties.Add(ts);

  return signedXml.Sign(alg, null, dataRaw, {
    keyValue: null,
    x509: [""],
    references: [
      {
        hash: "SHA-256",
        uri: "some.txt",
      }
    ],
    signingCertificate: "",
  });
}

function Verified(props) {
  if (props.value) {
    return <div>Verified!</div>
  } else {
    return <div></div>
  }
}

function Error(props) {
  if (props.value) {
    return <div>{props.value}</div>
  } else {
    return <div></div>
  }
}

function App() {
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);

  return (
    <div className="App">
      <input type="file" onChange={(event) => {
        Array.from(event.target.files).map((f) => {
          console.log(f);
          if (f.type == "application/vnd.etsi.asic-e+zip") {
            verify(f).then(setVerified).catch((e) => setError(e.message));
          }

          return f;
        })
      }} />
      <Verified value={verified} />
      <Error value={error} />
    </div>
  );
}

export default App;
