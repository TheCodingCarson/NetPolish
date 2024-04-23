document.addEventListener('DOMContentLoaded', function () {
    
    // =---Initialization---=
    let lastKnownURL = window.location.href; // Initialize with the current URL
    
    // "currentPhoto" Object
    window.currentFBPhoto = {
        uploader: {},
        imageData: {}
    };
    
    // Watch for URL Change
    function checkForURLChange() {
        let currentURL = window.location.href;
        if (currentURL !== lastKnownURL) {
            handleURLChange();
            lastKnownURL = currentURL; // Update the last known URL to the current
        }
    }
    
    // =---Re-initialize URl Changed---=
    
    function handleURLChange() {
    	// Log Re-initialize
    	console.log(`Facebook Downloader: URL Change Detected - Re-initializing`);
    	
      // Remove the existing button to prevent duplicates or reset state
      const existingButton = document.getElementById('FacebookDownloader_PageView_DLButton');
	    if (existingButton) {
        existingButton.parentNode.removeChild(existingButton); // Remove it if found
	    }
      
      // Reset global object
      window.currentFBPhoto = {
        uploader: {},
        imageData: {}
    	};
    	
    	// Remove Existing Items - If Left Behind
    	const existingDownloadLink = document.getElementById('FacebookDownloader_PageView');
	    if (existingDownloadLink) {
        existingDownloadLink.parentNode.removeChild(existingDownloadLink);
	    }
    	
      // Re-initialize the photo information and button creation process
      initialLoadEvents(0);
    }
    
    // =---Load Events---=
		
		// Set interval to check for URL changes every second
    setInterval(checkForURLChange, 1000);
		
		// Start initialLoadEvents
		initialLoadEvents(0);
		
		function initialLoadEvents(retryCount) {
			setTimeout(() => {
			
				// Get Current FB Photo Information
				const getFBImgError = getFBCurrentPhoto();
				if (getFBImgError instanceof Error) {
	        if (retryCount < 4) {
            setTimeout(() => initialLoadEvents(retryCount + 1), 1000);
          } else {
            console.error(`Facebook Downloader: Failed to get photo info after 4 retries - ${getFBImgError}`);
          }
          
          return;
		        
		    } else {
		    	
		    	// Create Download Button On Page
					const downloadButton = createDownloadButton();
					if (downloadButton instanceof Error) {
		        if (retryCount < 4) {
              setTimeout(() => initialLoadEvents(retryCount + 1), 1000);
            } else {
              console.error(`Facebook Downloader: Failed to create download button after 4 retries - ${downloadButton}`);
            }
            
            return;
            
        	} else {
				
						// Create Download Button EventHandler
						createDownloadButtonHandler(downloadButton);
						
		    	}
		    	
		    	// Everything Was Found, Set & Created (Without Error)
		    	console.log(`Facebook Downloader: Successfully Created Download Button`);
		    }
			}
		)}
		// =---Functions---=
		
		function createDownloadButton() {
			// Declare at unction scope - Prevents becoming undefined
			let targetFBContainer;
			
			// Check for the "Media Viewer" Container
			try {
				targetFBContainer = document.querySelector('div[data-name="media-viewer-nav-container"]');
				if (!targetFBContainer) {
            throw new Error("Media Viewer not Found");
        }
			}
			catch (error) {
				return new Error(`Failed to find Media Viewer: ${error.message}`);
			}
			
			// Try to Create & Append Download Button to targetFBContainer
			try {
				
				// Download Button Style
		    const downloadButton = document.createElement('button');
		    downloadButton.id = 'FacebookDownloader_PageView_DLButton';  // Unique ID - For Cleanup
		    downloadButton.className = 'fb-downloader-downloadbutton'; // Apply the CSS class
			downloadButton.innerText = 'Download Original'; // Set button text
		    
		    // Append the button to the container
	    	targetFBContainer.appendChild(downloadButton); // Throws Error if it fails
	    	return downloadButton; // Successfully created and appended
			}
			catch (error) {
				return new Error(`Failed to create Download Button (${error})`);
			}
		}
		
		function createDownloadButtonHandler (currentDLButton) {
			
			// Add Event Listener for Downloading
	    currentDLButton.addEventListener('click', () => {
		    event.preventDefault(); // Prevent creating a new tab
		    
		    // Create the anchor element
		    const downloadLink = document.createElement('a');
		    downloadLink.id = 'FacebookDownloader_PageView';  // Unique ID - For Cleanup
		    downloadLink.target = "_blank";
        downloadLink.download = replaceSpacesWithUnderscores(window.currentFBPhoto.imageData.name); // Generated Name For Downloaded File (Removes spaces)
        downloadLink.href = addCDNDirectDLAddon(window.currentFBPhoto.imageData.src); // CDN Original File URL (With Direct Download Parameter)
        downloadLink.title = window.currentFBPhoto.imageData.cdnTitle; // CDN Filename (Doesn't have file format)
        downloadLink.setAttribute('filename', window.currentFBPhoto.imageData.cdnName); // CDN Filename (Has file format)
        
		    // Create the image element
        const imageElement = document.createElement('img');
        imageElement.alt = window.currentFBPhoto.imageData.name; // Generated Name For Alt Name
        imageElement.src = window.currentFBPhoto.imageData.src; // // CDN Original Image Source URL
        imageElement.width = window.currentFBPhoto.imageData.maxWidth; // CDN Original Image Width (Highest Resolution)
        imageElement.height = window.currentFBPhoto.imageData.maxHeight; // CDN Original Image Height (Highest Resolution)
		    
		    // Append the image to the link
        downloadLink.appendChild(imageElement);
		    
		    // Append the link to the body temporarily and trigger the download
		    try {
		    	document.body.appendChild(downloadLink);
	        downloadLink.click();
	        document.body.removeChild(downloadLink);
	        
	        // If Download Succeeds, show the success modal
          showModal(`Successfully Downloaded - ${window.currentFBPhoto.imageData.name}${cdnNameToCDNImgFormat(window.currentFBPhoto.imageData.cdnName)}!`, 'success');
          console.log(`Facebook Downloader: Successfully Downloaded - ${window.currentFBPhoto.imageData.name}${cdnNameToCDNImgFormat(window.currentFBPhoto.imageData.cdnName)}!`);
		    }
        catch (error)
        {
        	// If an error occurs during download, show the danger(red) modal
          showModal(`Error Downloading. Please try again -  - ${error}`, 'danger');
        	console.error(`Facebook Downloader: Error Downloading - ${error}`);
        }
        
			});
		}
		
		function getFBCurrentPhoto () {
			
			// Check for the "Image Dataset" Container
			try {
				const FBCurrentPhotoImageDataset = document.querySelector('img[data-visualcompletion="media-vc-image"][referrerpolicy="origin-when-cross-origin"]');
				if (!FBCurrentPhotoImageDataset) {
            throw new Error("Photo Not Found");
        }
			
				// Get Original Image Source (Highest Resolution)
				window.currentFBPhoto.imageData.src = FBCurrentPhotoImageDataset.src;
				
				// Get Original Image Source Width & Height (Highest Resolution)
				window.currentFBPhoto.imageData.maxWidth = FBCurrentPhotoImageDataset.naturalWidth
				window.currentFBPhoto.imageData.maxHeight = FBCurrentPhotoImageDataset.naturalHeight
				
				// Get Uploader's Name & URL
				FBCurrentPhotoUploaderData = document.querySelector('object[type="nested/pressable"]').querySelector('a[role="link"]');
				if (!FBCurrentPhotoUploaderData.ariaLabel) {
					window.currentFBPhoto.uploader.name = "Facebook Downloader";
				} else {
					window.currentFBPhoto.uploader.name = FBCurrentPhotoUploaderData.ariaLabel;
				}
				window.currentFBPhoto.profileURL = FBCurrentPhotoUploaderData.href.split('?')[0];
				
				// Get Current Photo's Description (Fallback to URL Photo Name)
				if (FBCurrentPhotoImageDataset.alt !== "No photo description available." && FBCurrentPhotoImageDataset.alt !== "") {
						window.currentFBPhoto.imageData.name = `${window.currentFBPhoto.uploader.name}-${FBCurrentPhotoImageDataset.alt}`;
				} else {
					const FBParamsSearch = new URLSearchParams(window.location.search);
					window.currentFBPhoto.imageData.name = `${window.currentFBPhoto.uploader.name}-` + FBParamsSearch.get('fbid');
				}
				
				// Get FB CDN Image Name (using helper function)
				window.currentFBPhoto.imageData.cdnName = urlToCDNImgName(window.currentFBPhoto.imageData.src);
				
				// Get FB CDN Image Title (using helper function)
				window.currentFBPhoto.imageData.cdnTitle = urlToCDNImgTitle(window.currentFBPhoto.imageData.src);
				
				// Get FB CDN Original Image Format (using helper function)
				window.currentFBPhoto.imageData.imgFormat = cdnNameToCDNImgFormat(window.currentFBPhoto.imageData.cdnName);
				
			} 
			catch (error) {
				return error;
			}
		}
		
		// Helper Function - Replace Spaces with "_"
		function replaceSpacesWithUnderscores(text) {
    	return text.replace(/\s+/g, '_');
		}
		
		// Helper Function - Add CDN Direct Download URL Addon
		function addCDNDirectDLAddon(url) {
			return (url + "&dl=1");
		}
		
		// Helper Function - Get CDN Image Name
		function urlToCDNImgName(url) {
    
	    // Find the position of the fifth "/"
  		let thirdSlashIndex = -1;
	    let slashCount = 0;
	    for (let i = 0; i < url.length; i++) {
        if (url[i] === '/') {
          slashCount++;
          if (slashCount === 5) {
            thirdSlashIndex = i + 1; // Move past the fifth "/"
            break;
          }
        }
	    }
	
	    // Find the position of the "?"
	    let questionMarkIndex = url.indexOf('?');
	
	    // If there's no "?" use the length of the URL
	    if (questionMarkIndex === -1) {
        questionMarkIndex = url.length;
	    }
	
	    // Extract the substring between the fifth "/" and the "?"
	    if (thirdSlashIndex !== -1 && thirdSlashIndex < questionMarkIndex) {
        return url.substring(thirdSlashIndex, questionMarkIndex);
	    }
	
	    // Return original url if the conditions aren't met
	    return url;
		}
		
		//Helper Function - Get CDN Image Title
		function urlToCDNImgTitle(url) {
    
    	// Find the position of the fifth "/"
	    let fifthSlashIndex = -1;
	    let slashCount = 0;
	    for (let i = 0; i < url.length; i++) {
        if (url[i] === '/') {
          slashCount++;
          if (slashCount === 5) {
            fifthSlashIndex = i + 1; // Move past the fifth "/"
            break;
          }
      	}
    	}
	
	    // Find the position of the "?"
	    let questionMarkIndex = url.indexOf('?');
	
	    // If there's no "?" use the length of the URL
	    if (questionMarkIndex === -1) {
        questionMarkIndex = url.length;
	    }
	
	    // Extract the substring between the fifth "/" and the "?"
	    if (fifthSlashIndex !== -1 && fifthSlashIndex < questionMarkIndex) {
	        let partialUrl = url.substring(fifthSlashIndex, questionMarkIndex);
	
	        // Remove the image format
	        let lastDotIndex = partialUrl.lastIndexOf('.');
	        if (lastDotIndex !== -1) {
	            partialUrl = partialUrl.substring(0, lastDotIndex); // Strip extension
	        }
	        
	        return partialUrl;
	    }

	    // Return original url if the conditions aren't met
	    return url;
		}


		// Helper Function - Get Image Fromat type (ex: .png, .jpg, .jpeg)
		function cdnNameToCDNImgFormat(cdnNameToConvert) {
			
	    // Find the last occurrence of the "." which precedes the file extension
	    const dotIndex = cdnNameToConvert.lastIndexOf('.');
	
	    // Extract the substring from the dot to the end of the string (Including the ".")
	    if (dotIndex !== -1) {
				return cdnNameToConvert.substring(dotIndex);
			} else {
				// Return Error message if no "." is found
				return new Error("Failed to get file format");
			}
		}
		
		// ---Alert Modules---
		function showModal(message, type) {
			// Check if Modal is already shown and remove
			const alertModal = document.getElementById('FacebookDownloader_AlertModal');
	    if (alertModal) {
    		alertModal.parentNode.removeChild(alertModal); // Remove it if found
	    }
			
	    const modal = document.createElement('div');
	    modal.id = 'FacebookDownloader_AlertModal'; // Unique ID - For Cleanup
	    modal.className = `alert ${type === 'success' ? 'alert-success' : 'alert-danger'}`;
	    modal.role = 'alert';
	    modal.innerText = message;
	
	    document.body.appendChild(modal);
	
	    // Automatically remove the modal after 2 seconds
	    setTimeout(() => {
	    	const alertModal = document.getElementById('FacebookDownloader_AlertModal');
		    if (alertModal) {
      		alertModal.parentNode.removeChild(alertModal); // Remove it if found
		    }
	    }, 2000); // 2000 milliseconds = 2 seconds
		}
		
});