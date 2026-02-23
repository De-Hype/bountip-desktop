{
  "status": "success",
  "message": "Pulled full data for user",
  "syncType": "full",
  "currentTimestamp": "2026-02-20T16:40:45.634Z",
  "data": {
    "user": {
      "id": "147b4cc7-3fef-47af-9b2e-103ba5abd161",
      "email": "anthony@recreax.com",
      "fullName": "Anthony Nwanze",
      "password": "$2b$10$9WBAW/WJrtLCZj0d1WjQm.xp7oOWcyXzuGyHzaCgsc.BKn75l75Ay",
      "pin": "$2b$10$p55knfSc95AmLRQ3bdpVh.EyL92v/OyBeZn/MqHKQSPecSE4Klcji",
      "otpCodeHash": null,
      "otpCodeExpiry": null,
      "failedLoginCount": 0,
      "failedLoginRetryTime": null,
      "lastFailedLogin": "2026-02-19T07:46:14.150Z",
      "isEmailVerified": true,
      "isPin": true,
      "isDeleted": false,
      "lastLoginAt": "2026-02-20T12:05:28.418Z",
      "status": "active",
      "authProvider": null,
      "providerId": null,
      "publicId": null,
      "providerData": null,
      "createdAt": "2026-01-23T15:28:18.668Z",
      "updatedAt": "2026-02-20T11:05:28.676Z",
      "lastSyncedAt": null
    },
    "businesses": [
      {
        "id": "d2098444-28c9-44ff-b73d-4d4583eab575",
        "name": "Anthony Food and Bakeries",
        "slug": "anthony-food-and-bakeries-7234",
        "status": "active",
        "logoUrl": null,
        "country": null,
        "businessType": null,
        "address": null,
        "currency": null,
        "revenueRange": null,
        "createdAt": "2026-01-23T15:28:18.668Z",
        "updatedAt": "2026-01-23T15:28:18.668Z",
        "lastSyncedAt": null,
        "ownerId": "147b4cc7-3fef-47af-9b2e-103ba5abd161"
      }
    ],
    "outlets": [
      {
        "id": "5582ed74-8163-46e7-9c84-c804d32865fa",
        "name": "Anthony Foods and Drinks",
        "description": null,
        "address": "12 Oakland",
        "state": null,
        "email": null,
        "postalCode": null,
        "phoneNumber": "+2347087878787",
        "whatsappNumber": null,
        "currency": "USD",
        "revenueRange": "50000-100000",
        "country": "Canada",
        "storeCode": null,
        "localInventoryRef": null,
        "centralInventoryRef": null,
        "outletRef": "0OUT067856",
        "isMainLocation": false,
        "businessType": "bakery",
        "isActive": true,
        "whatsappChannel": true,
        "emailChannel": true,
        "isDeleted": false,
        "isOnboarded": true,
        "operatingHours": {
          "monday": {
            "open": "08:00",
            "close": "20:00",
            "isActive": true
          },
          "tuesday": {
            "open": "08:00",
            "close": "20:00",
            "isActive": true
          },
          "wednesday": {
            "open": "08:00",
            "close": "20:00",
            "isActive": true
          },
          "thursday": {
            "open": "08:00",
            "close": "20:00",
            "isActive": true
          },
          "friday": {
            "open": "08:00",
            "close": "20:00",
            "isActive": true
          },
          "saturday": {
            "open": "09:00",
            "close": "18:00",
            "isActive": true
          },
          "sunday": {
            "open": "09:00",
            "close": "16:00",
            "isActive": false
          }
        },
        "logoUrl": "https://res.cloudinary.com/drddkbcc5/image/upload/v1771598994/uploads/vbpupfj6b9svclkb6mxo.png",
        "taxSettings": {
          "taxes": [
            {
              "id": "d5236df3-266a-477a-97c3-706f614adf9f",
              "name": "VAT",
              "rate": 7.5,
              "applicationType": "checkout",
              "scope": "all"
            }
          ]
        },
        "serviceCharges": {
          "charges": [
            {
              "id": "da73d031-5957-468c-9e19-b4e24cf178fc",
              "name": "Service Charge",
              "rate": 5,
              "applicationType": "optional"
            }
          ]
        },
        "paymentMethods": {
          "methods": [
            {
              "id": "0ebe7ba5-33a1-4b56-a17a-74b715ab5318",
              "name": "Cash",
              "isActive": true
            },
            {
              "id": "2b59f660-24f6-4d51-8e60-fa8a174252b1",
              "name": "Bank Transfer",
              "isActive": true
            },
            {
              "id": "1e7f835b-d614-49df-ac1e-d6587838dbc5",
              "name": "Card",
              "isActive": true
            }
          ]
        },
        "priceTier": [
          {
            "id": "1a2631c3-918d-40fa-babc-26cd31f29a8c",
            "name": "Default",
            "description": "Base pricing for all products",
            "pricingRules": {
              "markupPercentage": 0
            },
            "isActive": true
          }
        ],
        "receiptSettings": {
          "customizedLogoUrl": "",
          "fontStyle": "default",
          "paperSize": "80mm",
          "showBakeryName": true,
          "showPaymentSuccessText": true,
          "customSuccessText": "Payment received successfully!",
          "showTotalPaidAtTop": true,
          "showCustomerName": true,
          "showOrderName": true,
          "showOrderTime": true,
          "showCompanyCashierName": false,
          "showCompanyPhoneNumber": true,
          "showCompanyEmail": false,
          "showCompanyBankDetails": false,
          "showCompanyBarcode": false,
          "showModifiedBelowItems": true,
          "selectedColumns": {
            "orderName": true,
            "sku": true,
            "qty": true,
            "subTotal": true,
            "total": true
          },
          "showDiscounts": true,
          "showTaxDetails": true,
          "showPaymentMethod": true,
          "customThankYouMessage": "Thank you for your purchase!",
          "customHeader": "",
          "showLogo": true
        },
        "labelSettings": {
          "customizedLogoUrl": "",
          "paperSize": "80mm",
          "fontStyle": "default",
          "showBakeryName": true,
          "showBakeryLogo": true,
          "customHeader": "",
          "showPaymentSuccessText": false,
          "customSuccessText": "",
          "showTotalPaidAtTop": false,
          "showLabelName": true,
          "showLabelType": true,
          "showProductName": true,
          "showProductBarCode": true,
          "showExpiryDate": false,
          "showBatchNumber": false,
          "showManufacturingDate": false,
          "showWeight": false,
          "showIngredientsSummary": false,
          "showAllergenInfo": false,
          "showPrice": true,
          "customThankYouMessage": ""
        },
        "invoiceSettings": {
          "customizedLogoUrl": "",
          "fontStyle": "default",
          "showBakeryName": true,
          "paperSize": "A4",
          "showPaymentSucessText": true,
          "customizedPaymentSucessText": "Payment received successfully!",
          "showTotalPaidAtTop": true,
          "showInvoiceNumber": true,
          "showInvoiceIssueDate": true,
          "showInvoiceDueDate": true,
          "showInvoiceClientName": true,
          "showInvoiceClientAddress": true,
          "showModifierBelowItems": false,
          "selectedColumns": {
            "orderName": true,
            "sku": true,
            "qty": true,
            "subTotal": true,
            "total": true
          },
          "showDiscountLine": true,
          "showTax": true,
          "showShippingFee": true,
          "showPaymentStatus": true,
          "showPaymentMethod": true,
          "showTaxOnOrderReceipt": false,
          "showTaxOnPaymentReceipt": false,
          "showAccountDetails": false,
          "showEmail": false,
          "showAddress": true,
          "customThankYouMessage": "Thank you for doing business with us!",
          "showLogo": true
        },
        "generalSettings": null,
        "createdAt": "2026-01-24T19:22:35.167Z",
        "updatedAt": "2026-02-20T14:49:59.499Z",
        "lastSyncedAt": null,
        "businessId": "d2098444-28c9-44ff-b73d-4d4583eab575",
        "bankDetails": null
      },
      {
        "id": "3fd3c36c-1f09-4889-9b01-f72d6a586f94",
        "name": "Burger Queen",
        "description": null,
        "address": "Abuja",
        "state": null,
        "email": null,
        "postalCode": null,
        "phoneNumber": "+2347033443344",
        "whatsappNumber": null,
        "currency": null,
        "revenueRange": null,
        "country": null,
        "storeCode": null,
        "localInventoryRef": null,
        "centralInventoryRef": null,
        "outletRef": "OUT-79633497D9A687",
        "isMainLocation": false,
        "businessType": null,
        "isActive": true,
        "whatsappChannel": true,
        "emailChannel": true,
        "isDeleted": false,
        "isOnboarded": false,
        "operatingHours": null,
        "logoUrl": null,
        "taxSettings": null,
        "serviceCharges": null,
        "paymentMethods": null,
        "priceTier": null,
        "receiptSettings": null,
        "labelSettings": null,
        "invoiceSettings": null,
        "generalSettings": null,
        "createdAt": "2026-02-16T10:11:49.554Z",
        "updatedAt": "2026-02-16T10:11:49.554Z",
        "lastSyncedAt": null,
        "businessId": "d2098444-28c9-44ff-b73d-4d4583eab575",
        "bankDetails": null
      },
      {
        "id": "34d1829c-596d-4eba-93cb-cf4447adf1be",
        "name": "Burger Queen",
        "description": null,
        "address": "Abuja",
        "state": null,
        "email": null,
        "postalCode": null,
        "phoneNumber": "+2347033333333",
        "whatsappNumber": null,
        "currency": null,
        "revenueRange": null,
        "country": null,
        "storeCode": null,
        "localInventoryRef": null,
        "centralInventoryRef": null,
        "outletRef": "OUT-79633497D48ED6",
        "isMainLocation": false,
        "businessType": null,
        "isActive": true,
        "whatsappChannel": true,
        "emailChannel": true,
        "isDeleted": false,
        "isOnboarded": false,
        "operatingHours": null,
        "logoUrl": null,
        "taxSettings": null,
        "serviceCharges": null,
        "paymentMethods": null,
        "priceTier": null,
        "receiptSettings": null,
        "labelSettings": null,
        "invoiceSettings": null,
        "generalSettings": null,
        "createdAt": "2026-02-16T10:10:48.943Z",
        "updatedAt": "2026-02-16T10:10:48.943Z",
        "lastSyncedAt": null,
        "businessId": "d2098444-28c9-44ff-b73d-4d4583eab575",
        "bankDetails": null
      },
      {
        "id": "58356262-ee0d-4b07-acf6-a14886f5a18f",
        "name": "Anthony Food and Bakeries",
        "description": null,
        "address": "Lagos Nigeria",
        "state": "Lagos",
        "email": "",
        "postalCode": "10027",
        "phoneNumber": "+23470787878787",
        "whatsappNumber": "",
        "currency": "NGN",
        "revenueRange": "10-500",
        "country": "Nigeria",
        "storeCode": "anthony-food-and-bakeries",
        "localInventoryRef": null,
        "centralInventoryRef": null,
        "outletRef": "0OUT140540",
        "isMainLocation": true,
        "businessType": "bakery",
        "isActive": true,
        "whatsappChannel": false,
        "emailChannel": true,
        "isDeleted": false,
        "isOnboarded": true,
        "operatingHours": {
          "monday": {
            "open": "08:00",
            "close": "20:00",
            "isActive": true
          },
          "tuesday": {
            "open": "08:00",
            "close": "20:00",
            "isActive": true
          },
          "wednesday": {
            "open": "08:00",
            "close": "20:00",
            "isActive": true
          },
          "thursday": {
            "open": "08:00",
            "close": "20:00",
            "isActive": true
          },
          "friday": {
            "open": "08:00",
            "close": "20:00",
            "isActive": true
          },
          "saturday": {
            "open": "09:00",
            "close": "18:00",
            "isActive": true
          },
          "sunday": {
            "open": "09:00",
            "close": "16:00",
            "isActive": false
          }
        },
        "logoUrl": "https://res.cloudinary.com/drddkbcc5/image/upload/v1769182231/uploads/rwburq8ucddtlfo3a15m.jpg",
        "taxSettings": {
          "taxes": [
            {
              "id": "c62afcf9-7161-40d2-aca6-2190a43afaf9",
              "name": "VAT",
              "rate": 7.5,
              "applicationType": "checkout",
              "scope": "all"
            }
          ]
        },
        "serviceCharges": {
          "charges": [
            {
              "id": "c6d0b89a-0508-4b49-befe-6fb89e2dd21c",
              "name": "Service Charge",
              "rate": 5,
              "applicationType": "optional"
            }
          ]
        },
        "paymentMethods": {
          "methods": [
            {
              "id": "56532985-60fe-4e2e-ab46-01c1a2f164bb",
              "name": "Cash",
              "isActive": true
            },
            {
              "id": "23127715-29b1-46e9-adfe-11c478dfe14b",
              "name": "Bank Transfer",
              "isActive": true
            },
            {
              "id": "2891b7a5-53cd-44bf-883c-b372da7adbe6",
              "name": "Card",
              "isActive": true
            }
          ]
        },
        "priceTier": [
          {
            "id": "51c6baae-4503-4c7f-a9b9-2660b0924953",
            "name": "Default",
            "description": "Base pricing for all products",
            "pricingRules": {
              "markupPercentage": 0
            },
            "isActive": true
          },
          {
            "id": "0fe8eacf-5a0e-460f-8508-70c6daf0944f",
            "name": "Special",
            "description": "Test",
            "pricingRules": {
              "markupPercentage": 0,
              "discountPercentage": 0,
              "fixedMarkup": 0,
              "fixedDiscount": 200
            },
            "isActive": true
          },
          {
            "id": "7317b512-4269-4ac2-886b-3ceeb248f179",
            "name": "Retail",
            "description": "Test",
            "pricingRules": {
              "markupPercentage": 2,
              "discountPercentage": 0,
              "fixedMarkup": 0,
              "fixedDiscount": 0
            },
            "isActive": true
          },
          {
            "id": "38b51f5d-be68-494c-83d8-c59667b25383",
            "name": "Wholesale",
            "description": "Wholesale",
            "pricingRules": {
              "markupPercentage": 0,
              "discountPercentage": 2,
              "fixedMarkup": 0,
              "fixedDiscount": 0
            },
            "isActive": true
          },
          {
            "id": "878512d6-c5e8-4625-8ea3-5c28c0709424",
            "name": "Wholesale pro",
            "description": "test",
            "pricingRules": {
              "markupPercentage": 0,
              "discountPercentage": 4,
              "fixedMarkup": 0,
              "fixedDiscount": 0
            },
            "isActive": true
          },
          {
            "id": "ccce432e-4700-42fc-afc4-21c92f4c2e5d",
            "name": "Special Orders",
            "description": "This are for special customers",
            "pricingRules": {
              "markupPercentage": 0,
              "discountPercentage": 0,
              "fixedMarkup": 0,
              "fixedDiscount": 1000
            },
            "isActive": true
          },
          {
            "id": "6a8a17ea-072e-41ba-88de-5595e3d32511",
            "name": "Special Customer",
            "description": "This is a price for our customers in Lekki",
            "pricingRules": {
              "markupPercentage": 0,
              "discountPercentage": 0,
              "fixedMarkup": 0,
              "fixedDiscount": 20
            },
            "isActive": true
          }
        ],
        "receiptSettings": {
          "customizedLogoUrl": "",
          "fontStyle": "default",
          "paperSize": "80mm",
          "showBakeryName": true,
          "showPaymentSuccessText": true,
          "customSuccessText": "Payment received successfully!",
          "showTotalPaidAtTop": true,
          "showCustomerName": true,
          "showOrderName": true,
          "showOrderTime": true,
          "showCompanyCashierName": false,
          "showCompanyPhoneNumber": true,
          "showCompanyEmail": false,
          "showCompanyBankDetails": false,
          "showCompanyBarcode": false,
          "showModifiedBelowItems": true,
          "selectedColumns": {
            "orderName": true,
            "sku": true,
            "qty": true,
            "subTotal": true,
            "total": true
          },
          "showDiscounts": true,
          "showTaxDetails": true,
          "showPaymentMethod": true,
          "customThankYouMessage": "Thank you for your purchase!",
          "customHeader": "",
          "showLogo": true
        },
        "labelSettings": {
          "customizedLogoUrl": "",
          "paperSize": "80mm",
          "fontStyle": "default",
          "showBakeryName": true,
          "showBakeryLogo": true,
          "customHeader": "",
          "showPaymentSuccessText": false,
          "customSuccessText": "",
          "showTotalPaidAtTop": false,
          "showLabelName": true,
          "showLabelType": true,
          "showProductName": true,
          "showProductBarCode": true,
          "showExpiryDate": false,
          "showBatchNumber": false,
          "showManufacturingDate": false,
          "showWeight": false,
          "showIngredientsSummary": false,
          "showAllergenInfo": false,
          "showPrice": true,
          "customThankYouMessage": ""
        },
        "invoiceSettings": {
          "customizedLogoUrl": "",
          "fontStyle": "default",
          "showBakeryName": true,
          "paperSize": "A4",
          "showPaymentSucessText": true,
          "customizedPaymentSucessText": "Payment received successfully!",
          "showTotalPaidAtTop": true,
          "showInvoiceNumber": true,
          "showInvoiceIssueDate": true,
          "showInvoiceDueDate": true,
          "showInvoiceClientName": true,
          "showInvoiceClientAddress": true,
          "showModifierBelowItems": false,
          "selectedColumns": {
            "orderName": true,
            "sku": true,
            "qty": true,
            "subTotal": true,
            "total": true
          },
          "showDiscountLine": true,
          "showTax": true,
          "showShippingFee": true,
          "showPaymentStatus": true,
          "showPaymentMethod": true,
          "showTaxOnOrderReceipt": false,
          "showTaxOnPaymentReceipt": false,
          "showAccountDetails": false,
          "showEmail": false,
          "showAddress": true,
          "customThankYouMessage": "Thank you for doing business with us!",
          "showLogo": true
        },
        "generalSettings": null,
        "createdAt": "2026-01-23T15:30:36.142Z",
        "updatedAt": "2026-02-05T10:24:03.985Z",
        "lastSyncedAt": null,
        "businessId": "d2098444-28c9-44ff-b73d-4d4583eab575",
        "bankDetails": null
      }
    ],
    "products": [
      {
        "id": "204fb364-b5fe-428d-b6cc-24ac543ea78a",
        "name": "chocolate muffin",
        "isActive": true,
        "description": "Sweet delicious muffin",
        "category": "cake",
        "price": "2.50",
        "preparationArea": "kitchen",
        "weight": "150.00",
        "productCode": "ANPR-8B63398B6D97E9",
        "weightScale": "g",
        "productAvailableStock": null,
        "packagingMethod": [
          "box"
        ],
        "priceTierId": [],
        "allergenList": {
          "allergies": [
            "Milk",
            "Gluten"
          ]
        },
        "logoUrl": "",
        "logoHash": "",
        "leadTime": 15,
        "availableAtStorefront": false,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-02-20T12:59:28.323Z",
        "updatedAt": "2026-02-20T12:59:28.323Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "41323e3e-276d-45ef-bd81-2cf4155dbcdb",
        "name": "coffee latte",
        "isActive": true,
        "description": "Hot coffee with steamed milk",
        "category": "beverage",
        "price": "3.20",
        "preparationArea": "bar",
        "weight": "330.00",
        "productCode": "ANPR-437DD2E3763A37",
        "weightScale": "g",
        "productAvailableStock": null,
        "packagingMethod": [
          "cup"
        ],
        "priceTierId": [],
        "allergenList": {
          "allergies": [
            "Milk"
          ]
        },
        "logoUrl": "",
        "logoHash": "",
        "leadTime": 15,
        "availableAtStorefront": false,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-02-20T12:59:28.323Z",
        "updatedAt": "2026-02-20T12:59:28.323Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "0bfadbe4-75b0-4fcd-90df-4794b02ca46e",
        "name": "green salad",
        "isActive": false,
        "description": "Fresh mixed vegetables",
        "category": "salad",
        "price": "4.50",
        "preparationArea": "kitchen",
        "weight": "200.00",
        "productCode": "ANPR-AD7332AD76D9D9",
        "weightScale": "g",
        "productAvailableStock": null,
        "packagingMethod": [
          "container"
        ],
        "priceTierId": [],
        "allergenList": {
          "allergies": []
        },
        "logoUrl": "",
        "logoHash": "",
        "leadTime": 15,
        "availableAtStorefront": false,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-02-20T12:59:28.323Z",
        "updatedAt": "2026-02-20T12:59:28.323Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "1a3c3b47-0865-4aee-9019-1cb7c9b64384",
        "name": "burnt cake",
        "isActive": true,
        "description": "Fresh bread",
        "category": "cake",
        "price": "700.00",
        "preparationArea": "Bakery",
        "weight": "300.00",
        "productCode": "ANPR-6837BB83269783",
        "weightScale": "g",
        "productAvailableStock": null,
        "packagingMethod": [
          "carton"
        ],
        "priceTierId": [],
        "allergenList": {
          "allergies": [
            "milk"
          ]
        },
        "logoUrl": "",
        "logoHash": "",
        "leadTime": 15,
        "availableAtStorefront": true,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-01-26T11:57:06.685Z",
        "updatedAt": "2026-02-19T11:59:03.341Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "06e62ded-b59a-4a5b-bc67-c608f7bfdefe",
        "name": "agege bread",
        "isActive": true,
        "description": "Sweet delicious muffin",
        "category": "cake",
        "price": "9.00",
        "preparationArea": "kitchen",
        "weight": "150.00",
        "productCode": "ANPR-E7B2997BAE8237",
        "weightScale": "g",
        "productAvailableStock": "4.00",
        "packagingMethod": [
          "box"
        ],
        "priceTierId": [],
        "allergenList": {
          "allergies": [
            "Milk",
            "Gluten"
          ]
        },
        "logoUrl": "",
        "logoHash": "",
        "leadTime": 15,
        "availableAtStorefront": true,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-01-26T11:57:06.685Z",
        "updatedAt": "2026-02-18T17:35:41.987Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "058b09ad-3314-4752-a87a-bec6d835f2bd",
        "name": "chocolate lava cake",
        "isActive": true,
        "description": "Decadent warm chocolate cake with a molten center, served with vanilla ice cream",
        "category": "Desserts",
        "price": "8.99",
        "preparationArea": "Pastry",
        "weight": "200.00",
        "productCode": "ANPR-9DA3EEDAA26A76",
        "weightScale": "g",
        "productAvailableStock": "2.00",
        "packagingMethod": [
          "Individual box",
          "Heat-safe container"
        ],
        "priceTierId": [
          "premium-tier"
        ],
        "allergenList": {
          "allergies": [
            "Gluten",
            "Dairy",
            "Eggs",
            "Soy"
          ]
        },
        "logoUrl": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "logoHash": "chocolate-lava-cake-001",
        "leadTime": 15,
        "availableAtStorefront": true,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-01-26T11:01:20.578Z",
        "updatedAt": "2026-02-05T10:19:17.824Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "f7b82091-ef35-4551-bfc1-a4cd29f5135e",
        "name": "fresh green salad",
        "isActive": true,
        "description": "Mixed greens with cherry tomatoes, cucumber, and house vinaigrette",
        "category": "Salads",
        "price": "12.75",
        "preparationArea": "Cold Station",
        "weight": "350.00",
        "productCode": "ANPR-9DA3EDE8699B24",
        "weightScale": "g",
        "productAvailableStock": "1.00",
        "packagingMethod": [
          "Compostable Container"
        ],
        "priceTierId": null,
        "allergenList": {
          "allergies": [
            "None"
          ]
        },
        "logoUrl": null,
        "logoHash": null,
        "leadTime": 0,
        "availableAtStorefront": true,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-01-24T19:51:27.295Z",
        "updatedAt": "2026-02-05T10:19:17.813Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "913200c2-6974-4316-845b-14156f8f103c",
        "name": "red velvet cake",
        "isActive": true,
        "description": "Fresh cake",
        "category": "cake",
        "price": "8.00",
        "preparationArea": "Bakery",
        "weight": "300.00",
        "productCode": "ANPR-B46B7746D23B49",
        "weightScale": "g",
        "productAvailableStock": "5.00",
        "packagingMethod": [
          "nylon"
        ],
        "priceTierId": [],
        "allergenList": {
          "allergies": [
            "milk"
          ]
        },
        "logoUrl": "",
        "logoHash": "",
        "leadTime": 15,
        "availableAtStorefront": true,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-01-26T11:57:06.685Z",
        "updatedAt": "2026-02-05T10:19:17.799Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "74fdef3e-2b62-4c5b-9cad-f7a6e0e9d93e",
        "name": "spring roll",
        "isActive": true,
        "description": "Hot coffee with steamed milk",
        "category": "beverage",
        "price": "3.20",
        "preparationArea": "bar",
        "weight": "330.00",
        "productCode": "ANPR-337666944D493A",
        "weightScale": "g",
        "productAvailableStock": "3.00",
        "packagingMethod": [
          "cup"
        ],
        "priceTierId": [],
        "allergenList": {
          "allergies": [
            "Milk"
          ]
        },
        "logoUrl": "",
        "logoHash": "",
        "leadTime": 15,
        "availableAtStorefront": false,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-02-05T08:14:41.072Z",
        "updatedAt": "2026-02-05T10:17:22.154Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "67d8a617-fe1a-45dc-92fa-a5daa512214a",
        "name": "puff puff",
        "isActive": true,
        "description": "Sweet delicious muffin",
        "category": "cake",
        "price": "2.50",
        "preparationArea": "kitchen",
        "weight": "150.00",
        "productCode": "ANPR-796333ADD2DA94",
        "weightScale": "g",
        "productAvailableStock": "4.00",
        "packagingMethod": [
          "box"
        ],
        "priceTierId": [],
        "allergenList": {
          "allergies": [
            "Milk",
            "Gluten"
          ]
        },
        "logoUrl": "",
        "logoHash": "",
        "leadTime": 15,
        "availableAtStorefront": false,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-02-05T08:14:41.072Z",
        "updatedAt": "2026-02-05T10:17:22.125Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "7fb523d5-277d-4240-9f99-a06c44bedc8d",
        "name": "egg roll",
        "isActive": true,
        "description": "Fresh egg roll",
        "category": "pasteries",
        "price": "9.00",
        "preparationArea": "Bakery",
        "weight": "400.00",
        "productCode": "ANPR-8B6799B6DE37B8",
        "weightScale": "g",
        "productAvailableStock": "20.00",
        "packagingMethod": [
          "nylon"
        ],
        "priceTierId": [],
        "allergenList": {
          "allergies": [
            "milk"
          ]
        },
        "logoUrl": "",
        "logoHash": "",
        "leadTime": 15,
        "availableAtStorefront": true,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-01-26T11:57:06.685Z",
        "updatedAt": "2026-02-05T10:17:22.114Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "086e6ac6-ba07-492a-b492-565489c7e1df",
        "name": "donot",
        "isActive": false,
        "description": "Fresh mixed vegetables",
        "category": "salad",
        "price": "4.50",
        "preparationArea": "kitchen",
        "weight": "200.00",
        "productCode": "ANPR-B46333899E9842",
        "weightScale": "g",
        "productAvailableStock": null,
        "packagingMethod": [
          "container"
        ],
        "priceTierId": [],
        "allergenList": {
          "allergies": []
        },
        "logoUrl": "",
        "logoHash": "",
        "leadTime": 15,
        "availableAtStorefront": true,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-02-05T08:14:41.072Z",
        "updatedAt": "2026-02-05T09:40:14.422Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "fdcb2b7d-0cd4-4648-8258-7582fb754481",
        "name": "artisan sourdough bread",
        "isActive": true,
        "description": "Traditional slow-fermented sourdough with crispy crust",
        "category": "Bakery",
        "price": "7.50",
        "preparationArea": "Bakery Station",
        "weight": "800.00",
        "productCode": "ANPR-6837B8BE9442D4",
        "weightScale": "g",
        "productAvailableStock": "1.00",
        "packagingMethod": [
          "Paper Bag",
          "Twine Tie"
        ],
        "priceTierId": [
          "bread-tier-1"
        ],
        "allergenList": {
          "allergies": [
            "Gluten",
            "Wheat"
          ]
        },
        "logoUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff",
        "logoHash": "xy7890123z",
        "leadTime": 1,
        "availableAtStorefront": true,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-01-24T19:51:27.295Z",
        "updatedAt": "2026-01-30T15:50:43.019Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "27dccfe8-b56c-47d2-b1a2-2de4c3eb7938",
        "name": "seasonal fruit jam triple",
        "isActive": false,
        "description": "Set of three artisanal jams: strawberry, blueberry, and apricot",
        "category": "Preserves",
        "price": "22.99",
        "preparationArea": "Preserves Kitchen",
        "weight": "450.00",
        "productCode": "ANPR-B46B7479388DA4",
        "weightScale": "g",
        "productAvailableStock": "1.00",
        "packagingMethod": [
          "Glass Jar",
          "Gift Box"
        ],
        "priceTierId": [
          "gift-tier-1",
          "premium-tier"
        ],
        "allergenList": {
          "allergies": []
        },
        "logoUrl": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136",
        "logoHash": "bc456def789",
        "leadTime": 3,
        "availableAtStorefront": true,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-01-24T19:51:27.295Z",
        "updatedAt": "2026-01-30T15:50:43.019Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "8ff84cff-96d0-414d-bc78-2b8f8ae7bf0f",
        "name": "milky loaf",
        "isActive": true,
        "description": "Fresh mixed vegetables",
        "category": "salad",
        "price": "4.50",
        "preparationArea": "kitchen",
        "weight": "200.00",
        "productCode": "ANPR-796EBB96783E93",
        "weightScale": "g",
        "productAvailableStock": null,
        "packagingMethod": [
          "container"
        ],
        "priceTierId": [],
        "allergenList": {
          "allergies": [
            "milk"
          ]
        },
        "logoUrl": "",
        "logoHash": "",
        "leadTime": 15,
        "availableAtStorefront": true,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-01-26T11:57:06.685Z",
        "updatedAt": "2026-01-30T15:50:43.019Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "ff607448-3f30-432c-9af9-e83fc54fcc9c",
        "name": "chocolate bread",
        "isActive": true,
        "description": "Hot coffee with steamed milk",
        "category": "beverage",
        "price": "3.20",
        "preparationArea": "bar",
        "weight": "330.00",
        "productCode": "ANPR-AD7E22D7643ED6",
        "weightScale": "g",
        "productAvailableStock": null,
        "packagingMethod": [
          "cup"
        ],
        "priceTierId": [],
        "allergenList": {
          "allergies": [
            "Milk"
          ]
        },
        "logoUrl": "",
        "logoHash": "",
        "leadTime": 15,
        "availableAtStorefront": true,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-01-26T11:57:06.685Z",
        "updatedAt": "2026-01-30T15:50:43.019Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "7a81c7e3-0c00-44db-992a-571f8362bde1",
        "name": "premium organic coffee",
        "isActive": true,
        "description": "A rich blend of organic coffee beans from Colombia",
        "category": "Beverages",
        "price": "15.99",
        "preparationArea": "Kitchen",
        "weight": "500.00",
        "productCode": "P-AD7E2D28E38D77",
        "weightScale": "g",
        "productAvailableStock": "1.00",
        "packagingMethod": [
          "Vacuum Sealed",
          "Recyclable"
        ],
        "priceTierId": [
          "tier-001",
          "tier-002"
        ],
        "allergenList": {
          "allergies": [
            "None"
          ]
        },
        "logoUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_CEe23hN1AqHhe2662T4RCF_s-Zp-IemqnA&s",
        "logoHash": "a1b2c3d4e5f67890",
        "leadTime": 2,
        "availableAtStorefront": true,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-01-24T19:29:18.079Z",
        "updatedAt": "2026-01-30T15:50:43.019Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "db29dbed-abdb-49ad-9756-07d65c6c1c22",
        "name": "craft iced coffee",
        "isActive": true,
        "description": "Cold brew coffee with notes of caramel and chocolate, served over ice",
        "category": "Beverages",
        "price": "5.75",
        "preparationArea": "Bar",
        "weight": "473.00",
        "productCode": "ANPR-437B223779D7A8",
        "weightScale": "ml",
        "productAvailableStock": null,
        "packagingMethod": [
          "Plastic cup",
          "Paper straw",
          "Sleeve"
        ],
        "priceTierId": [
          "drink-tier"
        ],
        "allergenList": {
          "allergies": [
            "Dairy"
          ]
        },
        "logoUrl": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "logoHash": "craft-iced-coffee-003",
        "leadTime": 5,
        "availableAtStorefront": true,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-01-26T11:01:20.578Z",
        "updatedAt": "2026-01-30T15:50:43.019Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      },
      {
        "id": "b8f9506b-83c5-43f9-8114-efddac8a1ceb",
        "name": "fresh garden salad",
        "isActive": true,
        "description": "Crisp mixed greens with cherry tomatoes, cucumbers, carrots, and house vinaigrette",
        "category": "Salads",
        "price": "12.50",
        "preparationArea": "Cold Station",
        "weight": "350.00",
        "productCode": "ANPR-E7B2997BB38B6B",
        "weightScale": "g",
        "productAvailableStock": null,
        "packagingMethod": [
          "Clamshell container",
          "Separate dressing cup"
        ],
        "priceTierId": [
          "standard-tier"
        ],
        "allergenList": {
          "allergies": [
            "None"
          ]
        },
        "logoUrl": "https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "logoHash": "garden-salad-002",
        "leadTime": 10,
        "availableAtStorefront": true,
        "createdAtStorefront": true,
        "isDeleted": false,
        "createdAt": "2026-01-26T11:01:20.578Z",
        "updatedAt": "2026-01-30T15:50:43.019Z",
        "lastSyncedAt": null,
        "outletId": "58356262-ee0d-4b07-acf6-a14886f5a18f"
      }
    ],
    "productHistory": [
      {
        "id": "61a7aaaf-0582-41ef-aefc-18c35f4509c7",
        "oldPrice": "7.00",
        "newPrice": "700.00",
        "changedBy": "anthony@recreax.com",
        "role": "user",
        "historyType": "price",
        "changeReason": null,
        "bulkData": null,
        "changedAt": "2026-02-19T11:59:02.150Z",
        "lastSyncedAt": null,
        "productId": "1a3c3b47-0865-4aee-9019-1cb7c9b64384"
      },
      {
        "id": "edf1d2d6-5663-4265-9a46-a6d5074bfcf0",
        "oldPrice": "70.00",
        "newPrice": "7.00",
        "changedBy": "anthony@recreax.com",
        "role": "user",
        "historyType": "price",
        "changeReason": null,
        "bulkData": null,
        "changedAt": "2026-02-19T11:54:57.555Z",
        "lastSyncedAt": null,
        "productId": "1a3c3b47-0865-4aee-9019-1cb7c9b64384"
      },
      {
        "id": "8bfda822-50bf-4565-8c68-625eca3189e8",
        "oldPrice": "7.00",
        "newPrice": "70.00",
        "changedBy": "anthony@recreax.com",
        "role": "user",
        "historyType": "price",
        "changeReason": null,
        "bulkData": null,
        "changedAt": "2026-02-19T11:53:03.531Z",
        "lastSyncedAt": null,
        "productId": "1a3c3b47-0865-4aee-9019-1cb7c9b64384"
      },
      {
        "id": "a48ff52b-bb2c-429c-b899-faede055ee8d",
        "oldPrice": "90.00",
        "newPrice": "9.00",
        "changedBy": "anthony@recreax.com",
        "role": "user",
        "historyType": "price",
        "changeReason": null,
        "bulkData": null,
        "changedAt": "2026-02-18T17:35:41.970Z",
        "lastSyncedAt": null,
        "productId": "06e62ded-b59a-4a5b-bc67-c608f7bfdefe"
      },
      {
        "id": "a77c32bb-4257-48b2-9f3e-52b9d077b1f6",
        "oldPrice": "2.50",
        "newPrice": "90.00",
        "changedBy": "anthony@recreax.com",
        "role": "user",
        "historyType": "price",
        "changeReason": null,
        "bulkData": null,
        "changedAt": "2026-01-26T22:53:11.993Z",
        "lastSyncedAt": null,
        "productId": "06e62ded-b59a-4a5b-bc67-c608f7bfdefe"
      },
      {
        "id": "7967bba3-bb03-459c-9b6b-0c87f1e5d8d7",
        "oldPrice": "15.99",
        "newPrice": "15.99",
        "changedBy": "anthony@recreax.com",
        "role": "user",
        "historyType": "price",
        "changeReason": null,
        "bulkData": null,
        "changedAt": "2026-01-24T19:29:22.361Z",
        "lastSyncedAt": null,
        "productId": "7a81c7e3-0c00-44db-992a-571f8362bde1"
      }
    ]
  }
}