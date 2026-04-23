
export function makeSlug(str) {
    return str
      .toString()
      .normalize('NFKD')
      .replace(/[\u0300-\u036F]/g, '') 
      .replace(/[^a-zA-Z0-9\s-]/g, '') 
      .trim()
      .replace(/\s+/g, '-')            
      .replace(/-+/g, '-')             
      .toLowerCase();
  }
  
  export async function getUniqueSlug(Model, baseSlug, excludeId = null) {
    let slug = baseSlug;
    let num = 1;
    let query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    while (await Model.exists(query)) {
      slug = `${baseSlug}-${num++}`;
      query.slug = slug;
    }
    return slug;
  }
  