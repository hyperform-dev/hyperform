describe('initer', () => {
  describe('getDefaultSectionString', () => {
    test('returns string on input: empty string', () => {
      const getDefaultSectionString = require('./index')._only_for_testing_getDefaultSectionString

      const filecontents = ` `
    
      let res = getDefaultSectionString(filecontents)
    
      expect(typeof res).toBe("string")
      expect(res.trim()).toBe("")
    })

    test('returns empty string on input: [default] header', () => {
      const getDefaultSectionString = require('./index')._only_for_testing_getDefaultSectionString

      const filecontents = `
      [defaut] 
      
      `
  
      let res = getDefaultSectionString(filecontents)
    
      expect(typeof res).toBe("string")
      expect(res.trim()).toBe("")
    })

    test('returns empty string on input: other header, other section', () => {
      const getDefaultSectionString = require('./index')._only_for_testing_getDefaultSectionString

      const filecontents = `
[some-other-header]
first
second 

      `
  
      let res = getDefaultSectionString(filecontents)
    
      expect(typeof res).toBe("string")
      expect(res.trim()).toBe("")
    })

    test('returns section on input: [default] header and section', () => {
      const getDefaultSectionString = require('./index')._only_for_testing_getDefaultSectionString

      const filecontents = `
[default] 
first
second
      `
  
      let res = getDefaultSectionString(filecontents)
    
      expect(typeof res).toBe("string")
      const text = res.trim() // 'first\nsecond'
      expect(/first/.test(text)).toBe(true)
      expect(/second/.test(text)).toBe(true)
      
    })


    test('returns section on input: other section 1, [default] header, section, other section 2', () => {
      const getDefaultSectionString = require('./index')._only_for_testing_getDefaultSectionString

      const filecontents = `
[some-other-profile-a]
sky
air
[default] 
first
second
[some-other-profile-b]
clouds
      `
  
      let res = getDefaultSectionString(filecontents)
    
      expect(typeof res).toBe("string")
      const text = res.trim()
      // We want all between [default] and next header, but nothing else
      expect(text).toBe("first\nsecond")
    })
  })

  describe('parseAwsCredentialsOrConfigFile', () => {
    test('returns default credentials on just [default] section present', () => {
      const  parseAwsCredentialsOrConfigFile  = require('./index')._only_for_testing_parseAwsCredentialsOrConfigFile

      const filecontents = `
[default]
aws_access_key_id = AKIA2WOM6JAHXXXXXXXX
aws_secret_access_key = XXXXXXXXXX+tgppEZPzdN/XXXXlXXXXX/XXXXXXX

` 
      const res = parseAwsCredentialsOrConfigFile(filecontents)

      expect(res).toBeDefined()
      expect(res.default).toBeDefined()
      expect(res.default.aws_access_key_id).toBe("AKIA2WOM6JAHXXXXXXXX")
      expect(res.default.aws_secret_access_key).toBe("XXXXXXXXXX+tgppEZPzdN/XXXXlXXXXX/XXXXXXX")
      
    })

    test('returns default credentials on multiple sections present', () => {
      const  parseAwsCredentialsOrConfigFile  = require('./index')._only_for_testing_parseAwsCredentialsOrConfigFile

      // the more weirdly formed
      const filecontents = `
      [some-other-section-a]
  some-other-section-field-b=1234567890
[default]
aws_access_key_id= AKIA2WOM6JAHXXXXXXXX
aws_secret_access_key =XXXXXXXXXX+tgppEZPzdN/XXXXlXXXXX/XXXXXXX
[some-other-section-b]
  some-other-section-field-b=098765434567898765
` 
      const res = parseAwsCredentialsOrConfigFile(filecontents)

      expect(res).toBeDefined()
      expect(res.default).toBeDefined()
      expect(res.default.aws_access_key_id).toBe("AKIA2WOM6JAHXXXXXXXX")
      expect(res.default.aws_secret_access_key).toBe("XXXXXXXXXX+tgppEZPzdN/XXXXlXXXXX/XXXXXXX")
    })
  })

  
})