# Facturama CFDI API

We will now actuall generate a CFDI for an invoice when the facturamaId is actually
set for a team. Propose a strategy that lets us have a new mdoel InvoiceCfdi to store
the facturama ID and the raw response. Use the facturamaId to fetch the client's
billing information so that you use that to generate the cfdi.

We need to make sure we can't attempt to generate more than 1 cfdi at a time, so
propose a way to use this cfdi table as a job tracker that doesn't allow mroe than
1 pending job at a time, or a new table, not sure, suggest a good appraoch.

To get a facturama client you use the get client API here is an example response:

```json
{
  "Id": "3PTFRSde-Oxq2kDVqsSQsA2",
  "Address": {
    "Street": "Calle de Pruebas",
    "ExteriorNumber": "123",
    "InteriorNumber": "456",
    "Neighborhood": "COLOMBIA",
    "ZipCode": "86991",
    "Locality": "NUEVO LEON",
    "Municipality": "ANAHUAC",
    "State": "NUEVO LEON",
    "Country": "MEXICO"
  },
  "Rfc": "URE180429TM6",
  "Name": "UNIVERSIDAD ROBOTICA ESPAÑOLA",
  "FiscalRegime": "601",
  "Email": "soporte-api@ejemplo.mx",
  "EmailOp1": "ejemplo@ejemplo.com",
  "EmailOp2": "ejemplo2@ejemplo.com",
  "CfdiUse": "G03",
  "TaxResidence": "86991",
  "NumRegIdTrib": "131494-1055",
  "TaxZipCode": "86991"
}
```

To generate a CFDI you use the following example request:

`FACTURAMA BASE URL/3/cfdis`

Example Request Body:

```json
{
  "CfdiType": "I", // keep
  "Currency": "MXN", // keep
  "PaymentForm": "03", // keep
  "PaymentMethod": "PUE", // keep
  "ExpeditionPlace": "64910", // keep
  "Date": "2025-07-07T13:03:00", // use current time in america/monterrey
  "Receiver": {
    // use the facturamaId to get receiver tax info
    "Rfc": "URE180429TM6",
    "CfdiUse": "G01",
    "Name": "UNIVERSIDAD ROBOTICA ESPAÑOLA",
    "FiscalRegime": "601",
    "TaxZipCode": "86991"
  },
  "Items": [
    // keep 1 item
    {
      "ProductCode": "8111252", // keep
      "Description": "Pago en Plataforma TERPA", // keep
      "UnitCode": "E48", // keep
      "UnitPrice": 100, // use the subtotal of the invoice's adjusted amount or total
      "Quantity": 1.0, // keep
      "Subtotal": 100, // same as unitprice
      "TaxObject": "02", // keep
      "Taxes": [
        // compute it using the IVA formula from SAT
        {
          "Total": 16,
          "Name": "IVA",
          "Base": 100,
          "Rate": 0.16,
          "IsRetention": false
        }
      ],
      "Total": 116
    }
  ]
}
```

Example Response Body

```json
{
  "Id": "YYGLURJpxOrCIQjpeXNAag2",
  "CfdiType": "ingreso",
  "Type": "I - ingreso",
  "Serie": "",
  "Folio": "3",
  "Date": "2025-07-07T13:03:00",
  "CertNumber": "00001000000707952915",
  "PaymentTerms": "03 - Transferencia electrónica de fondos",
  "PaymentMethod": "PUE - Pago en una sola exhibición",
  "PaymentAccountNumber": "",
  "PaymentBankName": "",
  "ExpeditionPlace": "64910",
  "ExchangeRate": 0.0,
  "Currency": "MXN - Peso Mexicano",
  "Subtotal": 100.0,
  "Discount": 0.0,
  "Total": 116.0,
  "Observations": "",
  "Issuer": {
    "FiscalRegime": "601 - General de Ley Personas Morales",
    "Rfc": "TSO240306URA",
    "TaxName": "TERPA SOLUTIONS",
    "Email": "patricio@terpasolutions.com",
    "Phone": "8120019854",
    "TaxAddress": {
      "Street": "Lazaro Cardenas",
      "ExteriorNumber": "2932",
      "Neighborhood": "Mirador",
      "ZipCode": "64910",
      "Municipality": "Monterrey",
      "State": "NUEVO LEON",
      "Country": "México"
    },
    "IssuedIn": {
      "Street": "",
      "ExteriorNumber": "",
      "Neighborhood": "-",
      "ZipCode": "64910",
      "Municipality": "",
      "State": "",
      "Country": "MEXICO"
    }
  },
  "Receiver": {
    "Rfc": "URE180429TM6",
    "Name": "UNIVERSIDAD ROBOTICA ESPAÑOLA",
    "Email": ""
  },
  "Items": [
    {
      "ProductCode": "81112502",
      "UnitCode": "E48",
      "Discount": 0.0,
      "CuentaPredial": "",
      "Quantity": 1.0,
      "Unit": "E48 - ",
      "Description": "Pago en Plataforma TERPA",
      "UnitValue": 100.0,
      "Total": 100.0
    }
  ],
  "Taxes": [
    {
      "Total": 16.0,
      "Name": "IVA",
      "Rate": 0.0,
      "Type": "transferred"
    }
  ],
  "Complement": {
    "TaxStamp": {
      "Uuid": "b3abcc71-fd40-4667-b629-6710631eedf7",
      "Date": "2025-07-07T13:29:04",
      "CfdiSign": "s8rQ9cCpSF/islahIqrRpdi7hUctpy6ktq7aM+rGj0UFAdsKH3Z2/UVriz7jJzmGswinoTujGTkwQPcOT1HPlIzsjdKNfoeUW6ZDOUDnmM6Dp95Kb50E+dLazwZAToCZtlhvkpxa5X3TG/U2A0NuX/Fn3QAQhGWEBZuDbMlDFPqgBEmjzIj3DNew2NBiwEJLV6eq2yYcPr3GjB2d1m9wdRDjbgGpRMn19v8muSDPyH9qqXi/yvyfrZrsJwPYgQoSTh4xAj45C4GBEs4xFr/NZWW2lKPSHL1fIhY1WfDYSdR/1G7gsmS6ymQ5POXlE2Y3nhKubDoqAzuZEEMWKRsKRA==",
      "SatCertNumber": "30001000000500003456",
      "SatSign": "GosQtHYaOXwfvtFYZ4/KSPK4uFUZ8KNlZ9TtJmfpW0rJBISLZWY9Zey16l79oJ6mdOcz+NUhifrlHtdba9RhSROF/sC9XMNGWDvss4TJM7M1VBGwNAwlNtxzBstN/E2LJEoUyO+/PbLe7H1tyI0bqNvx71imwBcCcICoqhY3L0lf52LAht93CjBwhl4ivPp/pMCa5YNMCwMLKsqYwrngeQXf5tnu54bMsP92NOGXHj/hv5dtii4x0TGEycZrEAGsDKvhdvrCmOxSHGJNNkdTCOFbTnRJmmpp70dX1pt4OlSrwslBU0vkC3Cz+Z5KEl+laG3ux8tZlAC7Pt1mXY6rng==",
      "RfcProvCertif": "SPR190613I52"
    }
  },
  "Status": "active",
  "OriginalString": "||4.0|3|2025-07-07T13:03:00|03|00001000000707952915|100|MXN|116.00|I|01|PUE|64910|TSO240306URA|TERPA SOLUTIONS|601|URE180429TM6|UNIVERSIDAD ROBOTICA ESPAÑOLA|86991|601|G01|81112501|1|E48|Pago en Plataforma TERPA|100|100|02|100|002|Tasa|0.160000|16|100.00|002|Tasa|0.160000|16.00|16.00||"
}
```
