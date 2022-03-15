import { atom, useRecoilState } from 'recoil'

import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select, { SelectChangeEvent } from '@mui/material/Select'

import { ContractPlatform } from '../../services'

export const platformState = atom({
  key: 'contractPlatform',
  default: ContractPlatform.Near
})

export const PlatformSelect: React.FC<{}> = () => {
  const [platform, setPlatform] = useRecoilState(platformState)

  const handleChange = (event: SelectChangeEvent) => {
    setPlatform(Number(event.target.value) as ContractPlatform)
  }

  return (
    <FormControl>
      <InputLabel id="demo-simple-select-label">Platform</InputLabel>
      <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={`${platform}`}
        label="platform"
        onChange={handleChange}
        style={{height: 40}}
      >
        <MenuItem value={ContractPlatform.Near}>Near</MenuItem>
        <MenuItem value={ContractPlatform.Polygon}>Polygon</MenuItem>
        <MenuItem value={ContractPlatform.Bsc}>Bsc</MenuItem>
        <MenuItem value={ContractPlatform.Substrate}>Substrate</MenuItem>
      </Select>
    </FormControl>
  )
}
