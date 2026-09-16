from pathlib import Path
import base64
root=Path(__file__).resolve().parent
text=(root/'partant.template.html').read_text()
fonts='\n'.join("@font-face{font-family:Hanken;font-style:normal;font-weight:"+str(weight)+";font-display:swap;src:url(data:font/ttf;base64,"+base64.b64encode((root/file).read_bytes()).decode()+") format('truetype')}" for weight,file in [(400,'hanken.ttf'),(600,'hanken-600.ttf'),(800,'hanken-800.ttf')])
text=text.replace('__FONTS__',fonts).replace('__PHOTO__','data:image/png;base64,'+base64.b64encode((root/'coaches.png').read_bytes()).decode())
(root.parent/'outputs'/'partant.html').write_text(text)
print('Built',len(text),'characters')
