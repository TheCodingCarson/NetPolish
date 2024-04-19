# NetPolish - Module Information
Table of Contents:
- [NetPolish - Module Information](#netpolish---module-information)
  - [The Module System](#the-module-system)
  - [Module Structure Layout](#module-structure-layout)
  - [Module 'ModuleName\_Excluded.json' Information \& Layout](#module-modulename_excludedjson-information--layout)
  - [Module 'ModuleName\_Settings.json' Information \& Layout](#module-modulename_settingsjson-information--layout)
  - [Module Setting Page Linking - Dynamic Generation of 'options.html' Tab](#module-setting-page-linking---dynamic-generation-of-optionshtml-tab)
  - [Closing Notes On Modules](#closing-notes-on-modules)


## The Module System
Modules are made in a way to make maintaining the codebase as easy as possible. There are a few extra fun things they do like dynamically creating the "options.html" page selection with the ability to have a options tab that can change the settings of multiple modules that may be related from the end user perspective but on the development side made more since to split off into multiple module folders.

## Module Structure Layout
Modules can include anything inside the folder for the name of the module as needed without any issues.
There are a few required files needed in each module folder listed here:
- ModuleName_Excluded.json
- ModuleName_Settings.json

Those are the only needed to required files for each module folder. Folders for modules **MUST** be the exact name of what is before the '_Excluded.json' and '_Settings.json' otherwise it will throw errors in the console.error log.

## Module 'ModuleName_Excluded.json' Information & Layout
A module's '_Excluded.json' must follow this layout:
```json
{
    "domains": [
        "domain1.com",
        "domain2.com",
        "domain3.com",
        "andso.on"
    ]
}
```
Domains listed in the '_Excluded.json' file are domains in which the **Module Will NOT Be Injected or Ran** and can be used for website. Module injection is done on a per Module basis using the helpers for module injection but this is mainly for modules that are being ran on every site to stop them from being injected to a certain list of domains that the module doesn't work with.

## Module 'ModuleName_Settings.json' Information & Layout
A module's '_Settings.json' must follow this layout:
```json
{
    "settings":
    [
        {
            "A Toggle Switch (This Key is the setting name)" : "Toggle",
            "A Slider (Default 0-100)" : "Slider",
            "A Slider with min and max values" : "Slider(500-1000)",
            "A Checkbox" : "Checkbox",
            "A User Text Input" : "Textinput",
            "A User Text Input with a Placeholder" : "Textinput('placeholder text')"
        }
    ]
}
```
More options will end up being implemented in the future but this is a up to date list of all the options that can be dynamically generated from a Module's '_Settings.json' and will be saved to chrome.local.storage using the 'ModuleName_SettingName' format.

## Module Setting Page Linking - Dynamic Generation of 'options.html' Tab
To have a tab created in 'options.html' for a module it is done in the '[module_list.json](module_list.json)' file located in the root directory of the 'modules' folder.
The layout goes as followed:
```json
{
    "modules":
    [
        {
            "VolumeBooster":
            [
                "VolumeBooster"
            ],

            "FacebookEnhancements":
            [
                "FacebookDownloader",
                "FacebookEnhancer"
            ],

            "DemoOptionsTabPage":
            [
                "ModuleName1",
                "ModuleName2",
                "ModuleName3",
                "ModuleName4"
            ]
        }
    ]
}
```
How it works is 'DemoOptionsTabPage' will end up being the name of the 'options.html' tab page and can be anything desired, the list of 'ModuleName' entries in the tree represent modules that can be found by that folder name and each one having a 'ModuleName_Settings.json' file in which when it generates the tab for the page name listed it will get all the options created in each ModuleName and add them together to give a seamless 'options.html' tab page that lets end users switch the required settings without knowing they are actually different modules on the dev side. It is not required to have more then one 'ModuleName' listed and is there as an added benefit to support more complex module systems. **Added Note:** the settings for each module will still be saved under the format listed in [Module 'ModuleName\_Settings.json' Information \& Layout](#module-modulename_settingsjson-information--layout) not under the name of the 'options.html' tab created above.

## Closing Notes On Modules
The Module System is created as an easier way for people forking 'NetPolish' to create additional features without hassle including settings up an options tab page for end users to easily save settings and make changes to the configuration all without having to setup a single thing for settings storage!

Other Parts of 'NetPolish' to checkout:
- [Back To Main Readme](../README.md)
- ['Helpers' Information](../helpers/Helpers.md)
- [Using Custom Javascript and CSS](UserJavascriptAndCSS/UserJavascriptAndCSS.md)

Created by **CodingCarson**