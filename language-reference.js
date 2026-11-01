(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LanguageReference=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const sections=[
    {title:'1. Writing instructions',rows:[
      ['SC 4, HDC 2; TURN','Separate instructions with spaces, commas or semicolons. Case does not matter.'],
      ['// comment','Ignore everything from // to the end of that source line. Blank lines are ignored.'],
      ['Row 1: SC 8','Optional Row n:, Round n: or Rnd n: labels. The label number does not set row numbering.'],
      ['New line','Continue the current fabric row. Only TURN or JOIN ends it.'],
      ['Counts','Whole numbers from 1 to 24,000. The generated preview can contain at most 24,000 yarn units.']
    ]},
    {title:'2. Stitch names and terminology',head:['US input','UK input / operation'],rows:[
      ['CH / CHAIN','CH / CHAIN: chain'],['SC','DC: single crochet (US) / double crochet (UK)'],
      ['HDC','HTR: half double / half treble'],['DC','TR: double / treble'],['TR','DTR: treble / double treble'],
      ['DTR','TTR: double treble / triple treble'],['SLST / SL ST / SL STITCH','Same in both modes: slip stitch'],
      ['MR / MAGIC RING','Same in both modes: one initial magic ring']
    ],notes:['Choose US or UK in the editor. The selector converts supported stitch tokens in the text. SC and HDC are also accepted as US aliases in UK mode. A ring must be the first operation and cannot take a count greater than one or stitch modifiers.']},
    {title:'3. Counts and placement',rows:[
      ['SC 4 / 4 SC','Four stitches, each into the next supporting stitch.'],['SC','One stitch; a missing count means one.'],
      ['DC 3 INTO NEXT','Three stitches sharing one next target. Consumes one supporting stitch.'],
      ['DC 3','Three stitches into three successive targets. Consumes three supporting stitches.']
    ],notes:['Write the count before or after a stitch, not both. Counts on decreases are the number of completed decreases. Counts are not attached to control words such as TURN or CABLE.']},
    {title:'4. Foundations, rows and rounds',rows:[
      ['CH 9, TURN','Make a foundation. The chain nearest the hook is excluded; eight targets remain.'],
      ['SK 2, DC 6','After CH 9, TURN, skip two more foundation targets and work six DC. Starting skips are explicit.'],
      ['TURN','Finish a flat fabric row and reverse the working direction.'],
      ['MR, SC 6, JOIN','Make a ring, six stitches into it, then close the round.'],
      ['JOIN','Close a magic-ring round with a slip stitch. That closing slip stitch does not count.'],
      ['JOIN*','Close the round and count its closing slip stitch as one additional stitch.'],
      ['SLST 1','An ordinary written slip stitch counts as one stitch.']
    ],notes:['A completed row becomes the supporting targets for the next row. Unworked targets cause a warning; working beyond the remaining targets is an error. TURN is for flat rows. JOIN is for rounds started with MR.']},
    {title:'5. Counted chains: *',rows:[
      ['CH 3*, TURN','The whole three-chain turn counts as the first stitch of the next row. The next ordinary stitch uses the second supporting target.'],
      ['TURN, CH 3*','Make the counted starting chain after turning instead. It also reserves the first supporting target.'],
      ['CH 11, CH 3*, TURN','Counted foundation turn: eleven foundation targets plus one counted starting chain. DC 11 completes a twelve-stitch first row.'],
      ['MR, CH 3*, DC 11, JOIN','The starting chain counts once, giving twelve stitches around the ring.'],
      ['SC 1, CH 3*, SK 3, SC 1','Inside a row, the three-chain bridge counts as one logical stitch. All three chains remain available as a chain space.'],
      ['CH 3 without *','A turning/starting run is uncounted. A bridge inside a row counts each chain separately. Foundation chains remain individual targets.']
    ],notes:['The star applies to the whole CH run, not to each chain. Use it on CH or JOIN. Ordinary working stitches already count. A counted chain needs an existing foundation, row or ring. If you finish the pattern after CH 3*, TURN, you have already begun a new row with one counted stitch.']},
    {title:'6. Front/back loops and posts',rows:[
      ['HDCblo 8 / HDC 8 BLO','Back loop only, viewed from the working side.'],['SCflo 8 / SC 8 FLO','Front loop only.'],
      ['FPDC 4 / DC 4 FP','Front post: work around the post of the supporting stitch.'],
      ['BPTR 4 / TR 4 BP','Back post. Use the selected terminology for the stitch name.'],
      ['No modifier','Work through both top loops.']
    ],notes:['FP and BP attach to a stitch token as a prefix, or follow its count as a separate word. BLO/FLO can be a suffix or follow the count. Choose a top-loop modifier or a post modifier; they cannot be combined. Chains and the magic ring do not take these modifiers.']},
    {title:'7. Explicit targets',rows:[
      ['INTO NEXT','The next unused supporting target. With a count, all resulting stitches share this one target.'],
      ['INTO SAME','Reuse the previous working stitch’s target without consuming another.'],
      ['SK 2 / SKIP 2','Skip the next two targets and remember them. Does not make stitches.'],
      ['INTO SKIPPED','Return to the most recently skipped target. Multiple returns take skipped targets in reverse order.'],
      ['INTO @12','Attach to yarn unit 12, which must already exist. An ahead-of-cursor target in the supporting row advances the cursor; an earlier one does not rewind it.'],
      ['INTO CH-SP 2','Work around chain space two in the supporting row, numbered in the current working direction.'],
      ['INTO SPACE 2','Alias for INTO CH-SP 2.'],['INTO RING','Work into the existing magic ring.']
    ],notes:['IN is an alias for INTO. THE after IN/INTO and ST or STITCH after the target are optional. IDs are global fabrication numbers shown by the stitch inspector, not positions within a row. A chain space groups adjacent bridge chains; turning chains do not form chain spaces.']},
    {title:'8. Increases and decreases',rows:[
      ['INC 3','Make two US SC / UK DC in each of the next three targets. Consumes three targets and makes six stitches.'],
      ['DEC 3 / SC2TOG 3','In US mode, make three SC decreases. Consumes six targets and makes three stitches. In UK mode write DC2TOG; DEC works in both modes.'],
      ['DC3TOG 2','In US mode, make two DC-three-together decreases. Consumes six targets and makes two stitches.'],
      ['STITCH2TOG … STITCH6TOG','Append 2TOG to 6TOG to a working stitch token. Post or loop placement can be specified as usual.'],
      ['DC 3 INTO SAME','Make a three-stitch increase into the preceding target.']
    ]},
    {title:'9. Cables',rows:[
      ['CABLE 2/2 FRONT','Cross two stitches over two. Uses FPTR in US mode / FPDTR in UK mode by default.'],
      ['CABLE 3/2 BACK FPDC','Use an unequal three-over-two crossing, with the returning first group behind the other group. This example uses US front-post DC.'],
      ['CABLE a/b FRONT stitch','Defer the next a targets, work b stitches into the following targets, then return to the first a targets in front of those stitches.'],
      ['CABLE a/b BACK stitch','Use the same target order, returning behind instead.'],
      ['DC 2, CABLE 2/2 FRONT, DC 2','Use a comma after the cable direction when omitting the optional stitch token and following it with another stitch instruction.'],
      ['[CABLE 2/2 FRONT FPTR] x2','Repeat two cable crossings. A cable always consumes and produces a+b logical stitches.']
    ],notes:['Both group sizes must be positive. The optional token can be SC, HDC, DC, TR or DTR in US terminology, or its UK equivalent, with an FP/BP prefix or BLO/FLO suffix. Counts and explicit targets are not part of that token. FRONT/BACK describes the returning group relative to the current working side; turn the work and that side reverses. Use BP stitches on return rows when you want post columns to remain raised on the same face.']},
    {title:'10. Grouped and nested repeats',rows:[
      ['[SC 1 HDC 1] x7','Repeat the group seven times.'],['[SC 1 HDC 1] repeat 7','Equivalent form.'],
      ['[SC 1 HDC 1] *7','Equivalent repeat form. This * is a multiplier after a bracket, not the counted-chain marker.'],
      ['(SC 1 HDC 1) 7 times','Parentheses and a plain count are also accepted.'],
      ['[[SC 1 HDC 1] x2 DC 2] x3','Nested groups are expanded in fabrication order.'],
      ['[SC 1 HDC 1]','A group without a repeat count runs once.']
    ],notes:['Keep each bracketed group on one source line and close every bracket. Groups can contain stitches, skips, cables, colour changes and TURN/JOIN. To repeat a group containing several source lines, use REPEAT ROWS.']},
    {title:'11. Repeating instruction lines',rows:[
      ['REPEAT ROW 2 x4','Run earlier instruction line two four additional times.'],
      ['REPEAT ROWS 3-4 x2','Run the earlier instruction lines three through four twice more.'],
      ['REPEAT ROW 2 4 TIMES','The x and TIMES are optional in this whole-line form.']
    ],notes:['Repeat references use the expanded sequence of non-empty instruction lines, not physical editor line numbers or fabric row numbers. Comment-only lines and repeat commands are not numbered; COLOUR instructions are. Earlier repeats insert additional numbered instruction lines. The optional Row n: label does not override these numbers. References must point backwards. Include TURN/JOIN in a repeated block when it must complete a fabric row.']},
    {title:'12. Colour changes',rows:[
      ['COLOUR #D1937D','Set the main yarn colour for subsequent yarn units.'],['COLOR #D1937D','Accepted spelling alias.'],
      ['#RRGGBB','Use exactly six hexadecimal digits. Letter case does not matter.']
    ],notes:['A written colour stays active until another COLOUR instruction. It overrides the main colour picker for those units. The second marled strand continues to use its own picker. A colour instruction makes no stitch and consumes no target.']}
  ];
  const examples=[
    {name:'Counted turning chains: twelve stitches per row',source:'CH 11, CH 3*, TURN\nDC 11, CH 3*, TURN\nDC 11',counts:[11,12,12]},
    {name:'Counted starting chains in joined rounds',source:'MR, CH 3*, DC 11, JOIN\nCH 3*, DC 11, JOIN',counts:[12,12]},
    {name:'Two cable panels, then return rows',source:'CH 21, TURN\nDC 20, CH 3, TURN\nDC 4, CABLE 2/2 FRONT FPTR, DC 4, CABLE 2/2 BACK FPTR, DC 4, CH 3, TURN\nDC 4, BPTR 4, DC 4, BPTR 4, DC 4, CH 3, TURN\nDC 4, FPTR 4, DC 4, FPTR 4, DC 4, CH 3, TURN\nDC 4, BPTR 4, DC 4, BPTR 4, DC 4, CH 3, TURN\nREPEAT ROWS 3-6 x2\nDC 20'},
    {name:'Chain space and three stitches sharing it',source:'CH 6, TURN\nSC 1, CH 3*, SK 3, SC 1, CH 1, TURN\nSC 1, DC 3 INTO CH-SP 1, SC 1',counts:[6,3,5]}
  ];
  function render(container){
    const doc=container.ownerDocument;container.replaceChildren();
    const make=(tag,text)=>{const el=doc.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
    for(const section of sections){
      const el=make('section');el.appendChild(make('h3',section.title));
      const table=make('table'),head=make('tr');for(const label of section.head||['Write','Effect'])head.appendChild(make('th',label));table.appendChild(head);
      for(const row of section.rows){const tr=make('tr');for(const cell of row)tr.appendChild(make('td',cell));table.appendChild(tr);}
      el.appendChild(table);for(const note of section.notes||[])el.appendChild(make('p',note));container.appendChild(el);
    }
    const full=make('section');full.className='wide';full.appendChild(make('h3','13. Complete examples'));
    for(const example of examples){full.appendChild(make('h4',example.name));full.appendChild(make('pre',example.source));}container.appendChild(full);
  }
  function markdown(){
    const lines=['# Loop pattern language 0.6.1',''];
    for(const s of sections){lines.push('## '+s.title,'','| '+(s.head||['Write','Effect']).join(' | ')+' |','| --- | --- |');for(const row of s.rows)lines.push('| '+row.map(c=>c.replaceAll('|','\\|')).join(' | ')+' |');lines.push('',...(s.notes||[]).map(n=>n+'\n'));}
    lines.push('## Complete examples','');for(const e of examples)lines.push('### '+e.name,'','```text',e.source,'```','');return lines.join('\n');
  }
  return {sections,examples,render,markdown};
});
