/* Embedded fallback copy of the question bank, so the app still works
   if it's opened directly (double-clicked) instead of served over http,
   since browsers block fetch() of local files for security. The app
   still prefers the live JSON file when available (e.g. via a local
   server), so edits to that file are picked up without touching this. */
window.PRACTICE_DATA = {
  "practiceTests": [
    {
      "id": "Week1-PT",
      "title": "CYBERSECURITY FOUNDATIONS",
      "subtitle": "WEEK 1- CYBER PRACTICE TEST",
      "categories": [
        {
          "id": "MULTIPLE-CHOICE QUESTIONS",
          "questions": [
            {
              "question": "What does Cybersecurity involve?",
              "options": [
                "Designing websites",
                "Creating social media accounts",
                "Sharing information publicly",
                "Protecting computers, networks, software and information"
              ],
              "answer": "Protecting computers, networks, software and information"
            },
            {
              "question": "Which of the following is a digital asset?",
              "options": [
                "Vehicles",
                "Buildings",
                "Files and documents",
                "Furniture"
              ],
              "answer": "Files and documents"
            },
            {
              "question": "What is a network?",
              "options": [
                "A single password",
                "A security policy",
                "A type of database",
                "A collection of devices that communicate and share information"
              ],
              "answer": "A collection of devices that communicate and share information"
            },
            {
              "question": "Which security technology can detect and prevent attacks?",
              "options": [
                "Photo editor",
                "Calculator",
                "Firewall",
                "Word processor"
              ],
              "answer": "Firewall"
            },
            {
              "question": "What helps organizations recover quickly after a cyber incident?",
              "options": [
                "Social media accounts",
                "Online shopping",
                "Password sharing",
                "Incident response and disaster recovery plans"
              ],
              "answer": "Incident response and disaster recovery plans"
            },
            {
              "question": "Why is cybersecurity important in daily life?",
              "options": [
                "Technology is never exposed to threats",
                "Passwords are not important",
                "Businesses do not use digital information",
                "People depend on technology and digital devices"
              ],
              "answer": "People depend on technology and digital devices"
            },
            {
              "question": "What are the three principles of the CIA Triad?",
              "options": [
                "Privacy, Password and Authentication",
                "Access, Control and Backup",
                "Confidentiality, Integrity and Availability",
                "Monitoring, Patching and Recovery"
              ],
              "answer": "Confidentiality, Integrity and Availability"
            },
            {
              "question": "What does Confidentiality protect?",
              "options": [
                "Information from being backed up",
                "Networks from natural disasters",
                "Information from unauthorized access",
                "Hardware from failure"
              ],
              "answer": "Information from unauthorized access"
            },
            {
              "question": "Which technologies help preserve Integrity?",
              "options": [
                "Firewalls, backups and cloud computing",
                "Emergency power and redundant servers",
                "Hashing, digital signatures and audit logs",
                "Antivirus, encryption and passwords"
              ],
              "answer": "Hashing, digital signatures and audit logs"
            },
            {
              "question": "Which can reduce Availability?",
              "options": [
                "Digital signatures",
                "Audit logs",
                "Password protection",
                "Hardware failures"
              ],
              "answer": "Hardware failures"
            },
            {
              "question": "What is the purpose of risk assessments?",
              "options": [
                "To replace all security systems",
                "To store photos",
                "To create social media accounts",
                "To gauge the probability and impact of a threat"
              ],
              "answer": "To gauge the probability and impact of a threat"
            },
            {
              "question": "What is Defense in Depth?",
              "options": [
                "Avoiding security monitoring",
                "Using only one security control",
                "Using multiple layers of defense",
                "Removing access controls"
              ],
              "answer": "Using multiple layers of defense"
            },
            {
              "question": "According to the Principle of Least Privilege, users should receive:",
              "options": [
                "Unlimited permissions",
                "No permissions at all",
                "Access to all systems",
                "Only the permissions needed to do their jobs"
              ],
              "answer": "Only the permissions needed to do their jobs"
            },
            {
              "question": "What is an important part of Security Awareness?",
              "options": [
                "Disabling security programs",
                "Training users to identify phishing emails and suspicious websites",
                "Avoiding security training",
                "Giving users unnecessary access"
              ],
              "answer": "Training users to identify phishing emails and suspicious websites"
            },
            {
              "question": "Why should systems be kept updated?",
              "options": [
                "Updates remove all security controls",
                "Updates prevent data backups",
                "Updates increase unnecessary access",
                "Updates repair vulnerabilities discovered in programs"
              ],
              "answer": "Updates repair vulnerabilities discovered in programs"
            }
          ]
        },
        {
          "id": "MATCHING",
          "questions": [
            {
              "question": "Match Column A with Column B.",
              "left": [
                "Cybersecurity",
                "Confidentiality",
                "Integrity",
                "Availability",
                "Defense in Depth",
                "Least Privilege",
                "Security Awareness",
                "Risk Management",
                "Patch Management",
                "Incident Response"
              ],
              "right": [
                "Access when an authorized user needs it",
                "Responding to incidents and recovering operations",
                "Identifying, analyzing and minimizing security threats",
                "Protection of computers, networks, software and information",
                "Knowledge about cyber threats and safe computing",
                "Multiple layers of defense",
                "Only required permissions",
                "Information remains complete and correct",
                "Keeping software up to date",
                "Information available to proper users"
              ],
              "answers": [
                {
                  "left": "Cybersecurity",
                  "right": "Protection of computers, networks, software and information"
                },
                {
                  "left": "Confidentiality",
                  "right": "Information available to proper users"
                },
                {
                  "left": "Integrity",
                  "right": "Information remains complete and correct"
                },
                {
                  "left": "Availability",
                  "right": "Access when an authorized user needs it"
                },
                {
                  "left": "Defense in Depth",
                  "right": "Multiple layers of defense"
                },
                {
                  "left": "Least Privilege",
                  "right": "Only required permissions"
                },
                {
                  "left": "Security Awareness",
                  "right": "Knowledge about cyber threats and safe computing"
                },
                {
                  "left": "Risk Management",
                  "right": "Identifying, analyzing and minimizing security threats"
                },
                {
                  "left": "Patch Management",
                  "right": "Keeping software up to date"
                },
                {
                  "left": "Incident Response",
                  "right": "Responding to incidents and recovering operations"
                }
              ]
            }
          ]
        },
        {
          "id": "DRAG AND DROP",
          "questions": [
            {
              "question": "Drag each item to its correct category.",
              "items": [
                "Least Privilege",
                "Firewall",
                "Hashing",
                "Confidentiality",
                "Patch Management",
                "Security Awareness",
                "Integrity",
                "Defense in Depth",
                "Data backups",
                "Availability"
              ],
              "categories": [
                "CIA Triad — Confidentiality",
                "CIA Triad — Integrity",
                "CIA Triad — Availability",
                "Security Controls / Principles"
              ],
              "answers": [
                {
                  "item": "Confidentiality",
                  "category": "CIA Triad — Confidentiality"
                },
                {
                  "item": "Integrity",
                  "category": "CIA Triad — Integrity"
                },
                {
                  "item": "Availability",
                  "category": "CIA Triad — Availability"
                },
                {
                  "item": "Firewall",
                  "category": "Security Controls / Principles"
                },
                {
                  "item": "Hashing",
                  "category": "CIA Triad — Integrity"
                },
                {
                  "item": "Data backups",
                  "category": "CIA Triad — Availability"
                },
                {
                  "item": "Least Privilege",
                  "category": "Security Controls / Principles"
                },
                {
                  "item": "Security Awareness",
                  "category": "Security Controls / Principles"
                },
                {
                  "item": "Defense in Depth",
                  "category": "Security Controls / Principles"
                },
                {
                  "item": "Patch Management",
                  "category": "Security Controls / Principles"
                }
              ]
            }
          ]
        },
        {
          "id": "YES / NO",
          "questions": [
            {
              "question": "Availability can be affected by Denial-of-Service (DoS) attacks.",
              "answer": "Yes"
            },
            {
              "question": "The Principle of Least Privilege gives employees unnecessary access to confidential information.",
              "answer": "No"
            },
            {
              "question": "Cybersecurity helps protect digital systems from cyber threats.",
              "answer": "Yes"
            },
            {
              "question": "Confidentiality means that information should remain complete and correct unless updated by an authorized person.",
              "answer": "No"
            },
            {
              "question": "Regular training is important because human errors are one of the main causes of cyber incidents.",
              "answer": "Yes"
            }
          ]
        },
        {
          "id": "SHORT ANSWER",
          "questions": [
            {
              "question": "What are the three objectives of the CIA Triad?",
              "answer": "Confidentiality, Integrity and Availability."
            },
            {
              "question": "What is the Principle of Least Privilege?",
              "answer": "Users must only be given the permissions needed to do their jobs."
            },
            {
              "question": "Why is it important to keep systems updated?",
              "answer": "Software developers release security patches to repair vulnerabilities discovered in their programs."
            }
          ]
        }
      ]
    },
    {
      "id": "Week2-PT",
      "title": "CYBERSECURITY FOUNDATIONS",
      "subtitle": "WEEK 2- CYBER PRACTICE TEST",
      "categories": [
        {
          "id": "MULTIPLE-CHOICE QUESTIONS",
          "questions": [
            {
              "question": "What is Authentication?",
              "options": [
                "The process of analyzing digital evidence",
                "The method to validate a user or device/application to gain access",
                "The process of assigning permissions",
                "The process of creating security policies"
              ],
              "answer": "The method to validate a user or device/application to gain access"
            },
            {
              "question": "Which authentication factor uses something the user knows?",
              "options": [
                "Mobile phone or token",
                "Security camera",
                "Password, PIN or security question",
                "Fingerprint or face scan"
              ],
              "answer": "Password, PIN or security question"
            },
            {
              "question": "Which is an example of Something You Have?",
              "options": [
                "Security question",
                "Fingerprint",
                "Password",
                "Mobile phone"
              ],
              "answer": "Mobile phone"
            },
            {
              "question": "Which authentication technique uses unique physical attributes?",
              "options": [
                "Password authentication",
                "Security question authentication",
                "Biometric authentication",
                "OTP authentication"
              ],
              "answer": "Biometric authentication"
            },
            {
              "question": "What does Multi-Factor Authentication (MFA) use?",
              "options": [
                "Only a security question",
                "Only a password",
                "Two or more methods of verification",
                "Only a username"
              ],
              "answer": "Two or more methods of verification"
            },
            {
              "question": "What does Authorization determine?",
              "options": [
                "How evidence is collected",
                "What an authenticated user can access",
                "How security logs are stored",
                "How a password is created"
              ],
              "answer": "What an authenticated user can access"
            },
            {
              "question": "In RBAC, permissions are assigned according to:",
              "options": [
                "The time of access",
                "The user's location",
                "A person's job role",
                "The device type"
              ],
              "answer": "A person's job role"
            },
            {
              "question": "Which attribute can be used by ABAC?",
              "options": [
                "Password",
                "Username",
                "Department",
                "Security question"
              ],
              "answer": "Department"
            },
            {
              "question": "Which of the following is a common permission?",
              "options": [
                "Investigate",
                "Monitor",
                "Assess",
                "Execute"
              ],
              "answer": "Execute"
            },
            {
              "question": "What does the Principle of Least Privilege require?",
              "options": [
                "Access to all systems",
                "Only the minimum permissions required",
                "Unlimited permissions",
                "No system access"
              ],
              "answer": "Only the minimum permissions required"
            },
            {
              "question": "Which role monitors networks for suspicious activity?",
              "options": [
                "CISO",
                "Security Analyst",
                "Security Engineer",
                "Security Manager"
              ],
              "answer": "Security Analyst"
            },
            {
              "question": "Which role designs and maintains firewalls, IDS and IPS?",
              "options": [
                "Ethical Hacker",
                "Incident Responder",
                "Security Analyst",
                "Security Engineer"
              ],
              "answer": "Security Engineer"
            },
            {
              "question": "Who legally attempts to identify system vulnerabilities?",
              "options": [
                "Incident Responder",
                "Security Manager",
                "Ethical Hacker",
                "CISO"
              ],
              "answer": "Ethical Hacker"
            },
            {
              "question": "Who collects, preserves and analyzes digital evidence?",
              "options": [
                "Security Analyst",
                "Security Engineer",
                "Digital Forensics Investigator",
                "Security Manager"
              ],
              "answer": "Digital Forensics Investigator"
            },
            {
              "question": "Who is ultimately responsible for an organization's information security strategy?",
              "options": [
                "Security Analyst",
                "Ethical Hacker",
                "Incident Responder",
                "Chief Information Security Officer (CISO)"
              ],
              "answer": "Chief Information Security Officer (CISO)"
            }
          ]
        },
        {
          "id": "MATCHING",
          "questions": [
            {
              "question": "Match Column A with Column B.",
              "left": [
                "Authentication",
                "Authorization",
                "RBAC",
                "ABAC",
                "Security Analyst",
                "Security Engineer",
                "Ethical Hacker",
                "Incident Responder",
                "Digital Forensics Investigator",
                "Security Manager"
              ],
              "right": [
                "Monitors systems and networks for suspicious activity",
                "Uses attributes such as department, location and device",
                "Validates a user or device/application",
                "Recognizes attacks, limits damage and gets things back to normal",
                "Develops security policies and runs the cybersecurity program",
                "Designs and maintains security technologies",
                "Legally identifies vulnerabilities",
                "What an authenticated user can access",
                "Permissions based on job role",
                "Collects, preserves and analyzes digital evidence"
              ],
              "answers": [
                {
                  "left": "Authentication",
                  "right": "Validates a user or device/application"
                },
                {
                  "left": "Authorization",
                  "right": "What an authenticated user can access"
                },
                {
                  "left": "RBAC",
                  "right": "Permissions based on job role"
                },
                {
                  "left": "ABAC",
                  "right": "Uses attributes such as department, location and device"
                },
                {
                  "left": "Security Analyst",
                  "right": "Monitors systems and networks for suspicious activity"
                },
                {
                  "left": "Security Engineer",
                  "right": "Designs and maintains security technologies"
                },
                {
                  "left": "Ethical Hacker",
                  "right": "Legally identifies vulnerabilities"
                },
                {
                  "left": "Incident Responder",
                  "right": "Recognizes attacks, limits damage and gets things back to normal"
                },
                {
                  "left": "Digital Forensics Investigator",
                  "right": "Collects, preserves and analyzes digital evidence"
                },
                {
                  "left": "Security Manager",
                  "right": "Develops security policies and runs the cybersecurity program"
                }
              ]
            }
          ]
        },
        {
          "id": "DRAG AND DROP",
          "questions": [
            {
              "question": "Drag each item to its correct category.",
              "items": [
                "Department",
                "Fingerprint",
                "PIN",
                "CISO",
                "Location",
                "Execute",
                "USB security key",
                "Face scan",
                "Password",
                "Delete",
                "Device type",
                "Mobile phone"
              ],
              "categories": [
                "Something You Know",
                "Something You Have",
                "Something You Are",
                "ABAC Attributes",
                "Permissions",
                "Cybersecurity Roles"
              ],
              "answers": [
                {
                  "item": "Password",
                  "category": "Something You Know"
                },
                {
                  "item": "PIN",
                  "category": "Something You Know"
                },
                {
                  "item": "Mobile phone",
                  "category": "Something You Have"
                },
                {
                  "item": "USB security key",
                  "category": "Something You Have"
                },
                {
                  "item": "Fingerprint",
                  "category": "Something You Are"
                },
                {
                  "item": "Face scan",
                  "category": "Something You Are"
                },
                {
                  "item": "Department",
                  "category": "ABAC Attributes"
                },
                {
                  "item": "Location",
                  "category": "ABAC Attributes"
                },
                {
                  "item": "Device type",
                  "category": "ABAC Attributes"
                },
                {
                  "item": "Execute",
                  "category": "Permissions"
                },
                {
                  "item": "Delete",
                  "category": "Permissions"
                },
                {
                  "item": "CISO",
                  "category": "Cybersecurity Roles"
                }
              ]
            }
          ]
        },
        {
          "id": "YES / NO",
          "questions": [
            {
              "question": "ABAC can use the time of access when making an access decision.",
              "answer": "Yes"
            },
            {
              "question": "Least Privilege gives users more permissions than they need to perform their jobs.",
              "answer": "No"
            },
            {
              "question": "Authorization takes place only after a user has been authenticated.",
              "answer": "Yes"
            },
            {
              "question": "A fingerprint is an example of Something You Have.",
              "answer": "No"
            },
            {
              "question": "Authentication is one of the first steps in information system protection.",
              "answer": "Yes"
            }
          ]
        },
        {
          "id": "SHORT ANSWER",
          "questions": [
            {
              "question": "What is Multi-Factor Authentication (MFA)?",
              "answer": "Multi-Factor Authentication uses two or more methods of verification to confirm a user is authentic."
            },
            {
              "question": "What is the difference between RBAC and ABAC?",
              "answer": "RBAC assigns permissions according to a person's job role, while ABAC makes access decisions using attributes such as department, location, device or time of access."
            },
            {
              "question": "What does an Incident Responder do?",
              "answer": "An Incident Responder is responsible for recognizing the attack, limiting damage and getting things back to normal."
            }
          ]
        }
      ]
    },
    {
      "id": "Week3-PT",
      "title": "CYBERSECURITY FOUNDATIONS",
      "subtitle": "WEEK 3- CYBER PRACTICE TEST",
      "categories": [
        {
          "id": "MULTIPLE-CHOICE QUESTIONS",
          "questions": [
            {
              "question": "What is a cyber threat?",
              "options": [
                "A security awareness program",
                "A security update",
                "A strong password",
                "Any incident, activity or person that can harm a digital system"
              ],
              "answer": "Any incident, activity or person that can harm a digital system"
            },
            {
              "question": "What is a vulnerability?",
              "options": [
                "A security control",
                "A security update",
                "A backup system",
                "A weakness that can be exploited by an adversary"
              ],
              "answer": "A weakness that can be exploited by an adversary"
            },
            {
              "question": "Which is a common source of vulnerabilities?",
              "options": [
                "Security awareness",
                "Software bugs",
                "Security updates",
                "Strong passwords"
              ],
              "answer": "Software bugs"
            },
            {
              "question": "What can software vulnerabilities allow attackers to do?",
              "options": [
                "Train employees",
                "Improve system security",
                "Install security updates",
                "Steal, view or destroy data"
              ],
              "answer": "Steal, view or destroy data"
            },
            {
              "question": "Which type of attack can crack easily guessable passwords?",
              "options": [
                "Baiting",
                "Vishing",
                "Tailgating",
                "Brute-force attack"
              ],
              "answer": "Brute-force attack"
            },
            {
              "question": "Why is human error a cybersecurity risk?",
              "options": [
                "It prevents cyber threats",
                "Unsafe actions can create security loopholes",
                "It strengthens passwords",
                "It automatically patches vulnerabilities"
              ],
              "answer": "Unsafe actions can create security loopholes"
            },
            {
              "question": "What is social engineering?",
              "options": [
                "Patching software vulnerabilities",
                "Encrypting sensitive information",
                "Monitoring network traffic",
                "Manipulating people to achieve an attacker's objective"
              ],
              "answer": "Manipulating people to achieve an attacker's objective"
            },
            {
              "question": "What is phishing?",
              "options": [
                "Installing software updates",
                "Calling users about technical issues",
                "Using fake messages or websites to trick users",
                "Following an employee into a restricted area"
              ],
              "answer": "Using fake messages or websites to trick users"
            },
            {
              "question": "What is vishing?",
              "options": [
                "Phishing through USB devices",
                "Phishing through restricted areas",
                "Voice phishing carried out over the telephone",
                "Phishing through software updates"
              ],
              "answer": "Voice phishing carried out over the telephone"
            },
            {
              "question": "What is smishing?",
              "options": [
                "Following an authorized employee",
                "Phishing through misleading text messages",
                "Using fake software updates",
                "Phishing through telephone calls"
              ],
              "answer": "Phishing through misleading text messages"
            },
            {
              "question": "What is pretexting?",
              "options": [
                "Offering free software containing malware",
                "Following an employee into a restricted area",
                "Impersonating someone or creating a believable story to obtain information",
                "Sending misleading text messages"
              ],
              "answer": "Impersonating someone or creating a believable story to obtain information"
            },
            {
              "question": "What is baiting?",
              "options": [
                "Calling victims to obtain information",
                "Following an authorized employee",
                "Tricking victims with something attractive that may contain malware",
                "Creating a fake identity only"
              ],
              "answer": "Tricking victims with something attractive that may contain malware"
            },
            {
              "question": "What is tailgating?",
              "options": [
                "Calling a victim",
                "Sending a fake email",
                "Using a malicious USB device",
                "Entering a restricted area by following an authorized employee"
              ],
              "answer": "Entering a restricted area by following an authorized employee"
            },
            {
              "question": "Which psychological tactic may cause users to act before thinking carefully?",
              "options": [
                "Authentication",
                "Urgency",
                "Encryption",
                "Patching"
              ],
              "answer": "Urgency"
            },
            {
              "question": "Which security measure provides extra protection when passwords are compromised?",
              "options": [
                "Baiting",
                "Tailgating",
                "Pretexting",
                "Multi-Factor Authentication (MFA)"
              ],
              "answer": "Multi-Factor Authentication (MFA)"
            }
          ]
        },
        {
          "id": "MATCHING",
          "questions": [
            {
              "question": "Match Column A with Column B.",
              "left": [
                "Cyber Threat",
                "Vulnerability",
                "Phishing",
                "Vishing",
                "Smishing",
                "Pretexting",
                "Baiting",
                "Tailgating",
                "Human Error",
                "Security Awareness"
              ],
              "right": [
                "Voice phishing over the telephone",
                "Training users to identify suspicious activities and follow safe practices",
                "A weakness that can be exploited",
                "Unsafe actions that create security loopholes",
                "Impersonating someone or creating a believable story",
                "Following an authorized employee into a restricted area",
                "Any potential danger or occurrence affecting an information system",
                "Misleading text messages used to trick users",
                "Manipulating people through fake emails, messages or websites",
                "Offering something attractive that may contain malware"
              ],
              "answers": [
                {
                  "left": "Cyber Threat",
                  "right": "Any potential danger or occurrence affecting an information system"
                },
                {
                  "left": "Vulnerability",
                  "right": "A weakness that can be exploited"
                },
                {
                  "left": "Phishing",
                  "right": "Manipulating people through fake emails, messages or websites"
                },
                {
                  "left": "Vishing",
                  "right": "Voice phishing over the telephone"
                },
                {
                  "left": "Smishing",
                  "right": "Misleading text messages used to trick users"
                },
                {
                  "left": "Pretexting",
                  "right": "Impersonating someone or creating a believable story"
                },
                {
                  "left": "Baiting",
                  "right": "Offering something attractive that may contain malware"
                },
                {
                  "left": "Tailgating",
                  "right": "Following an authorized employee into a restricted area"
                },
                {
                  "left": "Human Error",
                  "right": "Unsafe actions that create security loopholes"
                },
                {
                  "left": "Security Awareness",
                  "right": "Training users to identify suspicious activities and follow safe practices"
                }
              ]
            }
          ]
        },
        {
          "id": "DRAG AND DROP",
          "questions": [
            {
              "question": "Drag each item to its correct category.",
              "items": [
                "Urgency",
                "Smishing",
                "Curiosity",
                "Vishing",
                "Software bugs",
                "Trust",
                "Tailgating",
                "Weak passwords",
                "Misconfigured security settings",
                "Baiting",
                "Phishing",
                "Human error"
              ],
              "categories": [
                "Sources of Vulnerabilities",
                "Social Engineering Attacks",
                "Human Psychology Tactics"
              ],
              "answers": [
                {
                  "item": "Software bugs",
                  "category": "Sources of Vulnerabilities"
                },
                {
                  "item": "Weak passwords",
                  "category": "Sources of Vulnerabilities"
                },
                {
                  "item": "Human error",
                  "category": "Sources of Vulnerabilities"
                },
                {
                  "item": "Misconfigured security settings",
                  "category": "Sources of Vulnerabilities"
                },
                {
                  "item": "Phishing",
                  "category": "Social Engineering Attacks"
                },
                {
                  "item": "Vishing",
                  "category": "Social Engineering Attacks"
                },
                {
                  "item": "Smishing",
                  "category": "Social Engineering Attacks"
                },
                {
                  "item": "Baiting",
                  "category": "Social Engineering Attacks"
                },
                {
                  "item": "Tailgating",
                  "category": "Social Engineering Attacks"
                },
                {
                  "item": "Urgency",
                  "category": "Human Psychology Tactics"
                },
                {
                  "item": "Trust",
                  "category": "Human Psychology Tactics"
                },
                {
                  "item": "Curiosity",
                  "category": "Human Psychology Tactics"
                }
              ]
            }
          ]
        },
        {
          "id": "YES / NO",
          "questions": [
            {
              "question": "Social engineering directly attacks computer technology rather than manipulating people.",
              "answer": "No"
            },
            {
              "question": "Tailgating occurs when an unauthorized person enters a restricted area by following an authorized employee.",
              "answer": "Yes"
            },
            {
              "question": "Users should click suspicious links to verify where they lead.",
              "answer": "No"
            },
            {
              "question": "Installing security updates promptly can help protect against software vulnerabilities.",
              "answer": "Yes"
            },
            {
              "question": "A vulnerability is a weakness that can be exploited by an adversary.",
              "answer": "Yes"
            }
          ]
        },
        {
          "id": "SHORT ANSWER",
          "questions": [
            {
              "question": "What is the difference between a threat and a vulnerability?",
              "answer": "A threat is a potential danger or occurrence, while a vulnerability is a weakness that can be exploited by an adversary."
            },
            {
              "question": "Why is social engineering successful?",
              "answer": "Social engineering exploits human psychology and manipulates people into taking unsafe actions."
            },
            {
              "question": "How can users help prevent social engineering attacks?",
              "answer": "Users should receive security awareness training, avoid suspicious links, verify websites and report suspicious messages immediately."
            }
          ]
        }
      ]
    }
  ]
};
