'''
Module containing all the input data classes
'''

from pydantic import BaseModel

class BurnInput(BaseModel):
    ''' 
    Class for input burning input data
    '''
    street_type: str
    fire_unit: str
    structure_type: str
    structure_category: str
    roof_material: str
    eaves: str
    exterior_siding: str
    window_pane: str
    attached_patio_material: str
    attached_fence_material: str
    age: int 
    