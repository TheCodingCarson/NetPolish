document.addEventListener('DOMContentLoaded', function () {
    
    // Initialization
    let lastKnownURL = window.location.href; // Initialize with the current URL
    const existingButton = document.getElementById('VSCO_MediaView_DLButton');
    if (existingButton) {
        existingButton.parentNode.removeChild(existingButton); // Ensure No Button Exists
    }
    
    // Watch for URL Change
    function checkForURLChange() {
        let currentURL = window.location.href;
        if (currentURL !== lastKnownURL) {
            handleURLChange();
            lastKnownURL = currentURL; // Update the last known URL
        }
    }
    
    function handleURLChange() {
        console.log(`VSCO Downloader: URL Change Detected`);
        
        // Remove the existing button
        const existingButton = document.getElementById('VSCO_MediaView_DLButton');
        if (existingButton) {
            existingButton.parentNode.removeChild(existingButton); // Remove if found
        }
        
        // Ensure url matches pattern
        if (window.location.href.includes('media')) {
        	initializeDownloadProcess();
        	console.log(`VSCO Downloader: Re-initializing`);
        }
    }
    
    function initializeDownloadProcess() {
        const downloadButton = createDownloadButton();
        if (downloadButton) {
            document.querySelector('main').appendChild(downloadButton); // Append the download button to the body
            console.log(`VSCO Downloader: Successfully Created Download Button`);
        }
    }
    
    // Check for URL changes every second
    setInterval(checkForURLChange, 1000);
    initializeDownloadProcess(); // Initialize download process on page load

    function createDownloadButton() {
        const downloadLink = document.createElement('a');
        downloadLink.id = 'VSCO_MediaView_DLButton';  // Unique ID
        downloadLink.className = 'vsco-downloader-downloadbutton'; // Apply the CSS class
        downloadLink.innerText = 'Download Original'; // Set button text
        downloadLink.addEventListener('click', handleDownload);
        return downloadLink;
    }

    function handleDownload(event) {
	    event.preventDefault();
	    const imageDetails = GetFullSizedImage();
	    if (imageDetails) {
	        const encodedUrl = btoa(imageDetails.originalVSCOImageFile);
	        const proxyURL = `https://cors.netpolish.com/?url=${encodedUrl}`;
	        fetch(proxyURL)
            .then(response => response.blob())
            .then(blob => {
                const mimeType = imageDetails.VSCOImageMIMEType || 'application/octet-stream'; // Default MIME type if not determined
                const correctTypeBlob = new Blob([blob], { type: mimeType });
                const url = window.URL.createObjectURL(correctTypeBlob);
                const tempLink = document.createElement('a');
                tempLink.style.display = 'none';
                tempLink.href = url;
                tempLink.download = imageDetails.generatedVSCOImageDLFileName;
                document.body.appendChild(tempLink);
                tempLink.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(tempLink);
                showModal(`Successfully downloaded: ${imageDetails.generatedVSCOImageDLFileName}`, 'success');
            })
            .catch(error => {
                console.error('Download failed:', error);
                showModal('Failed to download the file.', 'danger');
            });
	    } else {
	        showModal('No image found to download.', 'danger');
	    }
	}

	function fileTypeToMimeType(fileType) {
		const mimeTypes = {
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.gif': 'image/gif',
			'.webp': 'image/webp',
			'.heic': 'image/heic',
			'.heif': 'image/heif'
		};
		return mimeTypes[fileType.toLowerCase()];
	}

    function GetFullSizedImage() {
        const currentVSCOImageSrc = findImageClosestToCenter();
        if (!currentVSCOImageSrc) {
            return null;
        }
        const originalVSCOImageFile = removeQueryString(currentVSCOImageSrc);
        const vscoImgAuthorUsername = getVSCOUploaderUsername();
        const originalVSCOImageFileName = getVSCOImageName();
        const originalVSCOImageFileType = urlToFileType(originalVSCOImageFile);
        const generatedVSCOImageDLFileName = generateVSCOImageDLFileName() + originalVSCOImageFileType;
        const VSCOImageMIMEType = fileTypeToMimeType(originalVSCOImageFileType);
        return {
            originalVSCOImageFile,
            generatedVSCOImageDLFileName,
            VSCOImageMIMEType
        };
    }

    function getVSCOUploaderUsername() {
	    const usernameMeta = document.querySelector(`meta[property='og:title']`);
	    if (usernameMeta) {
	        const content = usernameMeta.getAttribute('content');
	        const pipeIndex = content.indexOf('|');
	        if (pipeIndex !== -1) {
	            // If a "|" exists, extract the part after the "|" and trim leading spaces
	            return content.substring(pipeIndex + 1).replace(/^\s+/, '');
	        } else {
	            // If no "|" is found, return the entire content unmodified
	            return content;
	        }
	    }
    	return 'Unknown'; // Return 'Unknown' if the meta tag isn't found
		}

    function getVSCOImageName() {
        const imageMeta = document.querySelector(`meta[property='og:url']`);
        if (imageMeta) {
            const url = imageMeta.getAttribute('content');
            const lastIndex = url.lastIndexOf('/');
            return lastIndex !== -1 ? url.substring(lastIndex + 1) : url; // Extract filename from URL
        }
        return 'Unknown';
    }
    
    function generateVSCOImageDLFileName() {
    	const imageAuthor = getVSCOUploaderUsername();
    	const imageDescription = document.querySelector(`meta[property='og:description']`);
    	const imageTime = document.querySelector(`time[datetime]`).getAttribute('datetime');
    	
    	// Return "Author Name - Post Description" or if no post description "Author Name - Post DateTime"
    	if (imageDescription) {
    		const imageDescriptionContent = imageDescription.getAttribute('content');
    		if (imageDescriptionContent && imageDescriptionContent !== `See more of ${imageAuthor}’s content on VSCO.`) {
    			return cleanInvalidCharacters(imageAuthor) + ' - ' + cleanInvalidCharacters(imageDescriptionContent);
    		}
    		// If post description is invalid return default "Author Name - Post Description"
    		return cleanInvalidCharacters(imageAuthor) + ' - ' + formatDateTime(imageTime);
    	} else {
    		return cleanInvalidCharacters(imageAuthor) + ' - ' + formatDateTime(imageTime);
    	}
    }

    function showModal(message, type) {
        const modal = document.createElement('div');
        modal.id = 'VSCO_MediaView_AlertModal';
        modal.className = `alert ${type === 'success' ? 'alert-success' : 'alert-danger'}`;
        modal.innerText = message;

        document.body.appendChild(modal);

        setTimeout(() => {
            const alertModal = document.getElementById('VSCO_MediaView_AlertModal');
            if (alertModal) {
                alertModal.parentNode.removeChild(alertModal);
            }
        }, 2000); // 2000 milliseconds = 2 seconds
    }

    function findImageClosestToCenter() {
        const images = document.querySelectorAll('img');
        let closestImage = null;
        let minDistanceToCenter = Infinity;
        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = window.innerHeight / 2;

        images.forEach(img => {
            if (img.offsetParent && img.naturalWidth > 0) {
                const rect = img.getBoundingClientRect();
                const imageCenterX = rect.left + rect.width / 2;
                const imageCenterY = rect.top + rect.height / 2;
                const distanceToCenter = Math.sqrt(Math.pow(imageCenterX - viewportCenterX, 2) + Math.pow(imageCenterY - viewportCenterY, 2));
                if (distanceToCenter < minDistanceToCenter) {
                    closestImage = img;
                    minDistanceToCenter = distanceToCenter;
                }
            }
        });
        return closestImage ? closestImage.src : null;
    }

		// Helper Function - Format ISO datetime to "Month(str)-Day(int)-Year(4 int) H-M-S-PM/AM"
	function formatDateTime(dateString) {
	  const date = new Date(dateString);
	  const months = ["January", "February", "March", "April", "May", "June",
					  "July", "August", "September", "October", "November", "December"];
	  
	  let day = date.getDate();
	  let month = months[date.getMonth()];
	  let year = date.getFullYear();
	  let hours = date.getHours();
	  let minutes = date.getMinutes().toString().padStart(2, '0');
	  let seconds = date.getSeconds().toString().padStart(2, '0');
	  let ampm = hours >= 12 ? 'PM' : 'AM';
	  
	  hours = hours % 12;
	  hours = hours ? hours : 12; // the hour '0' should be '12'
	  
	  return `${month}-${day}-${year} ${hours}-${minutes}-${seconds}-${ampm}`;
	}
		
	// Helper Function - Remove invalid file name characters
	function cleanInvalidCharacters(string) {
	return string.replace(/[\\/:*?"<>|\0.]+/g, '').trim();
	}

	// Helper Function - Remove URL Query String
    function removeQueryString(url) {
      const lastIndex = url.lastIndexOf('?');
      return lastIndex !== -1 ? url.substring(0, lastIndex) : url;
    }
    
    // Helper Function - Get File Type from URL
    function urlToFileType(url) {
	    // Find the last occurrence of the "." before any query parameters
	    const lastIndex = url.lastIndexOf('.');
	    const questionMarkIndex = url.indexOf('?', lastIndex);
	
	    // Check if there's a query string
	    const cleanEndIndex = questionMarkIndex === -1 ? url.length : questionMarkIndex;
	
	    // Extract the substring from the dot to the end of the filename or the start of the query parameters
	    if (lastIndex !== -1 && lastIndex < cleanEndIndex) {
	        return url.substring(lastIndex, cleanEndIndex);
	    } else {
	        // Return Error if no valid file extension is found
	        return new Error("Failed to get file format");
	    }
	}
});